// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Advertisement {
    enum AdStatus { Pending, Active, Rejected }

    struct Ad {
        address payable owner;
        string content;
        uint256 acceptedAt;
        AdStatus status;
    }

    address public admin;
    uint256 public adCounter;
    uint256 public constant AD_DURATION = 1 days;
    uint256 public constant AD_FEE = 0.001 ether;

    mapping(uint256 => Ad) public ads;

    event AdSubmitted(uint256 adId, address indexed user, string content);
    event AdAccepted(uint256 adId);
    event AdRejected(uint256 adId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function submitAd(string calldata content) external payable {
        require(msg.value == AD_FEE, "Must pay fee");
        adCounter++;
        ads[adCounter] = Ad({
            owner: payable(msg.sender),
            content: content,
            acceptedAt: 0,
            status: AdStatus.Pending
        });
        emit AdSubmitted(adCounter, msg.sender, content);
    }

    function acceptAd(uint256 adId) external onlyAdmin {
        Ad storage ad = ads[adId];
        require(ad.status == AdStatus.Pending, "Not pending");
        ad.status = AdStatus.Active;
        ad.acceptedAt = block.timestamp;

        (bool success, ) = payable(admin).call{value: AD_FEE}("");
        require(success, "Failed to send fee");

        emit AdAccepted(adId);
    }

    function rejectAd(uint256 adId) external onlyAdmin {
        Ad storage ad = ads[adId];
        require(ad.status == AdStatus.Pending, "Not pending");
        ad.status = AdStatus.Rejected;

        (bool success, ) = payable(ad.owner).call{value: AD_FEE}("");
        require(success, "Failed to refund");
        emit AdRejected(adId);
    }

    function getAdState(uint256 adId) public view returns (string memory) {
        Ad storage ad = ads[adId];
        if (ad.status == AdStatus.Pending) {
            return "Pending";
        } else if (ad.status == AdStatus.Rejected) {
            return "Rejected";
        } else if (ad.status == AdStatus.Active) {
            if (block.timestamp > ad.acceptedAt + AD_DURATION) {
                return "Expired";
            } else {
                return "Active";
            }
        }
        return "Unknown";
    }

    function getActiveAds() external view returns (uint256[] memory activeIds, string[] memory contents) {

        uint256 count;
        for (uint256 i = 1; i <= adCounter; i++) {
            if (ads[i].status == AdStatus.Active && block.timestamp <= ads[i].acceptedAt + AD_DURATION) {
                count++;
            }
        }
        activeIds = new uint256[](count);
        contents = new string[](count);
        uint256 index;
        for (uint256 i = 1; i <= adCounter; i++) {
            if (ads[i].status == AdStatus.Active && block.timestamp <= ads[i].acceptedAt + AD_DURATION) {
                activeIds[index] = i;
                contents[index] = ads[i].content;
                index++;
            }
        }
    }
}

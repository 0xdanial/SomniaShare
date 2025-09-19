// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

interface ISocialCore {
    function posts(uint256 postId) external view returns (uint256 profileId, string memory content, uint256 likeCount);
    function ownerOf(uint256 profileId) external view returns (address);
}

contract PostNFT is ERC721, Ownable, ERC2771Context {
    uint256 internal _tokenIdCounter;

    ISocialCore public immutable socialCore;
    uint256 public listingPrice = 0.01 ether;

    mapping(uint256 => uint256) public postIdToTokenId;
    mapping(uint256 => uint256) public tokenIdToPostId;

    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;

    event NFTMinted(uint256 indexed tokenId, uint256 indexed postId, address indexed owner);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTDelisted(uint256 indexed tokenId);

    constructor(address _socialCoreAddress, address trustedForwarder) 
        ERC721("Post NFT", "PNFT") 
        Ownable(msg.sender)
        ERC2771Context(trustedForwarder)
    {
        require(_socialCoreAddress != address(0), "SocialCore address cannot be zero");
        socialCore = ISocialCore(_socialCoreAddress);
    }

    function createPostNFT(uint256 _postId, bool _listForSale) external {
        require(postIdToTokenId[_postId] == 0, "Post: Already minted as an NFT");
        (uint256 profileId, ,) = socialCore.posts(_postId);
        require(profileId != 0, "Post: Does not exist in SocialCore");
        address postOwner = socialCore.ownerOf(profileId);
        require(postOwner == _msgSender(), "Authorization: Only the post owner can mint");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(_msgSender(), newTokenId);

        postIdToTokenId[_postId] = newTokenId;
        tokenIdToPostId[newTokenId] = _postId;
        emit NFTMinted(newTokenId, _postId, _msgSender());

        if (_listForSale) {
            listings[newTokenId] = Listing(_msgSender(), listingPrice);
            emit NFTListed(newTokenId, _msgSender(), listingPrice);
        }
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        uint256 postId = tokenIdToPostId[_tokenId];
        (, string memory postContent, ) = socialCore.posts(postId);

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Post NFT #',
                        _toString(_tokenId),
                        '", "description": "',
                        postContent,
                        '", "attributes": [{"trait_type": "Original Post ID", "value": ',
                        _toString(postId),
                        '}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && listings[tokenId].seller != address(0)) {
            revert("NFT is listed for sale and cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    function listNFT(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == _msgSender(), "Authorization: Not the owner");
        require(listings[_tokenId].seller == address(0), "Marketplace: Already listed");

        listings[_tokenId] = Listing(_msgSender(), listingPrice);
        emit NFTListed(_tokenId, _msgSender(), listingPrice);
    }

    function buyNFT(uint256 _tokenId) external payable {
        Listing memory currentListing = listings[_tokenId];
        require(currentListing.seller != address(0), "Marketplace: Not for sale");
        require(msg.value == currentListing.price, "Payment: Incorrect price sent");
        require(currentListing.seller != _msgSender(), "Action: Cannot buy your own NFT");

        address seller = currentListing.seller;

        delete listings[_tokenId];
        
        _transfer(seller, _msgSender(), _tokenId);
        
        (bool success, ) = seller.call{value: msg.value}("");
        require(success, "Payment: Transfer failed");

        emit NFTSold(_tokenId, seller, _msgSender(), msg.value);
    }

    function delistNFT(uint256 _tokenId) external {
        require(listings[_tokenId].seller == _msgSender(), "Authorization: Not the seller");
        
        delete listings[_tokenId];
        emit NFTDelisted(_tokenId);
    }

    function setListingPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than zero");
        listingPrice = _newPrice;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function isTrustedForwarder(address forwarder) public view override returns (bool) {
        return ERC2771Context.isTrustedForwarder(forwarder);
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}

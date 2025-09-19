// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract SocialCore is ERC721, Ownable, ERC2771Context {

    uint256 public nextProfileId = 1;
    uint256 public nextPostId = 1;
    uint256 public nextCommentId = 1;
    uint256 public nextPostNFTId = 1;

    uint256 public blueMarkPrice = 0.001 ether;
    uint256 public blueMarkBalance;

    struct Post {
        uint256 profileId;
        string content;
        uint256 likeCount;
    }

    struct Comment {
        address owner;
        string content;
    }

    mapping(address => string) public profileUsernames;
    mapping(address => uint256) public ownerToProfile;
    mapping(uint256 => bool) public hasBlueMark;

    mapping(uint256 => Post) public posts;
    mapping(uint256 => uint256[]) public postsByProfile;
    mapping(uint256 => mapping(uint256 => bool)) public postLikes;

    mapping(uint256 => Comment) public comments;
    mapping(uint256 => uint256[]) public commentsByPost;

    mapping(uint256 => uint256) public postToNFT;
    mapping(uint256 => uint256) public nftToPost;

    event ProfileCreated(address indexed owner, uint256 indexed profileId, string username);
    event PostCreated(uint256 indexed profileId, uint256 indexed postId, string content);

    event CommentCreated(uint256 indexed postId, uint256 indexed commentId, address indexed owner, string content);
    event PostMintedAsNFT(uint256 indexed profileId, uint256 indexed postId, uint256 indexed nftId);
    event PostLiked(uint256 indexed postId, uint256 indexed profileId, bool liked);
    event BlueMarkPurchased(uint256 indexed profileId, address indexed owner, uint256 amount);
    event BlueMarkFeesClaimed(address indexed owner, uint256 amount);

    constructor(address trustedForwarder) 
        ERC721("SocialProfile", "SPRO") 
        Ownable(msg.sender) 
        ERC2771Context(trustedForwarder) 
    {}

    function createProfile(string calldata username) external returns (uint256) {
        address user = _msgSender();
        require(ownerToProfile[user] == 0, "Profile already exists");

        uint256 profileId = nextProfileId++;
        _mint(user, profileId);
        profileUsernames[user] = username;
        ownerToProfile[user] = profileId;

        emit ProfileCreated(user, profileId, username);
        return profileId;
    }

    function buyBlueMark() external payable {
        address user = _msgSender();
        uint256 profileId = ownerToProfile[user];
        require(profileId != 0, "Profile required");
        require(!hasBlueMark[profileId], "Already has blue mark");
        require(msg.value >= blueMarkPrice, "Insufficient payment");

        hasBlueMark[profileId] = true;
        blueMarkBalance += msg.value;

        emit BlueMarkPurchased(profileId, user, msg.value);
    }

    function claimBlueMarkFees() external onlyOwner {
        uint256 amount = blueMarkBalance;
        require(amount > 0, "No fees to claim");
        blueMarkBalance = 0;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed to send Ether");
        
        emit BlueMarkFeesClaimed(owner(), amount);
    }

    function createPost(string calldata content) external returns (uint256) {
        address user = _msgSender();
        uint256 profileId = ownerToProfile[user];
        require(profileId != 0, "Profile required");

        uint256 postId = nextPostId++;
        posts[postId] = Post(profileId, content, 0);
        postsByProfile[profileId].push(postId);

        emit PostCreated(profileId, postId, content);
        return postId;
    }

    function toggleLike(uint256 postId) external {
        address user = _msgSender();
        uint256 profileId = ownerToProfile[user];
        require(profileId != 0, "Profile required");
        require(posts[postId].profileId != 0, "Post does not exist");

        bool liked = postLikes[postId][profileId];
        if (liked) {
            posts[postId].likeCount--;
            postLikes[postId][profileId] = false;
        } else {
            posts[postId].likeCount++;
            postLikes[postId][profileId] = true;
        }

        emit PostLiked(postId, profileId, !liked);
    }

    function createComment(uint256 postId, string calldata content) external returns (uint256) {
        address user = _msgSender();
        uint256 profileId = ownerToProfile[user];
        require(profileId != 0, "Profile required");
        require(posts[postId].profileId != 0, "Post does not exist");

        uint256 commentId = nextCommentId++;

        comments[commentId] = Comment(user, content);
        commentsByPost[postId].push(commentId);

        emit CommentCreated(postId, commentId, user, content);
        return commentId;
    }

    function getProfilePosts(address user) external view returns (string[] memory) {
        uint256 profileId = ownerToProfile[user];
        require(profileId != 0, "Profile required");

        uint256[] storage ids = postsByProfile[profileId];
        string[] memory result = new string[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = posts[ids[i]].content;
        }

        return result;
    }

    function getPostComments(uint256 postId) external view returns (address[] memory, string[] memory) {
        uint256[] storage ids = commentsByPost[postId];
        address[] memory owners = new address[](ids.length);
        string[] memory contents = new string[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            Comment storage commentData = comments[ids[i]];
            owners[i] = commentData.owner;
            contents[i] = commentData.content;
        }

        return (owners, contents);
    }

    function getCommentIdsByPost(uint256 postId) external view returns (uint256[] memory) {
        require(posts[postId].profileId != 0, "Post does not exist");
        return commentsByPost[postId];
    }

    function getPostLikes(uint256 postId) external view returns (uint256) {
        return posts[postId].likeCount;
    }

    function hasProfileBlueMark(address profile) external view returns (bool) {
        uint256 profileId = ownerToProfile[profile];
        return hasBlueMark[profileId];
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Transfers are disabled");
        }
        return super._update(to, tokenId, auth);
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
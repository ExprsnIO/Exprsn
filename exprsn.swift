import Foundation
import SwiftData

// MARK: - Enums

enum SubscriptionStatus: String, Codable, CaseIterable {
    case active, expired, cancelled, pending
}

enum ProfileType: String, Codable, CaseIterable {
    case personal, professional, business, creative
}

enum CertificateStatus: String, Codable, CaseIterable {
    case active, revoked, expired
}

enum TokenValidityType: String, Codable, CaseIterable {
    case permanent, expiryDate, durationDays, maxUses
}

enum TokenVisibility: String, Codable, CaseIterable {
    case `public`, `private`, restricted
}

enum StorageProvider: String, Codable, CaseIterable {
    case s3, gcs, azure, cloudflare, backblaze, ipfs, arweave, custom
}

enum PaymentSchedule: String, Codable, CaseIterable {
    case oneTime, monthly, yearly, weekly
}

enum PayoutStatus: String, Codable, CaseIterable {
    case pending, processing, completed, failed
}

enum ReportStatus: String, Codable, CaseIterable {
    case open, underReview, resolved, rejected
}

enum ModerationAction: String, Codable, CaseIterable {
    case none, warn, hideContent, restrictAccount, suspendAccount, banAccount
}

enum EncryptionMethod: String, Codable, CaseIterable {
    case bcrypt, argon2id, scrypt, pbkdf2, aes256gcm, chacha20poly1305, rsa, ed25519, ecies
}

enum VersionChangeType: String, Codable, CaseIterable {
    case major, minor, patch, security
}

// MARK: - Core Models

@Model
final class User {
    @Attribute(.unique) var id: Int
    @Attribute(.unique) var username: String
    @Attribute(.unique) var email: String
    var password: String
    var encryptionMethod: EncryptionMethod = .bcrypt
    var encryptionParams: [String: Any] = ["cost": 12]
    var role: String = "user"
    var displayName: String
    var bio: String?
    var avatarUrl: String?
    var subdomain: String?
    var federationId: String?
    var did: String? // Decentralized Identifier
    var publicKey: String? // For verification and encryption
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var lastLogin: Date?
    var isVerified: Bool = false
    var isActive: Bool = true
    var settings: [String: Any] = [:]
    var currentThemeId: Int?
    var defaultProfileId: Int?
    var totpSecret: String?
    var backupCodes: [String]?
    var accountType: String = "standard"
    var metadata: [String: Any]?
    var contentPubKey: String? // Public key for content signing
    var contentSignatureAlgo: String = "ed25519"
    
    // Relationships
    @Relationship(deleteRule: .cascade, inverse: \UserProfile.user)
    var profiles: [UserProfile] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Post.user)
    var posts: [Post] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Follow.follower)
    var following: [Follow] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Follow.following)
    var followers: [Follow] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Like.user)
    var likes: [Like] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Group.creator)
    var createdGroups: [Group] = []
    
    @Relationship(deleteRule: .cascade, inverse: \UserGroupMembership.user)
    var groupMemberships: [UserGroupMembership] = []
    
    @Relationship(deleteRule: .cascade, inverse: \MediaItem.user)
    var mediaItems: [MediaItem] = []
    
    @Relationship(deleteRule: .cascade, inverse: \DirectMessage.sender)
    var sentMessages: [DirectMessage] = []
    
    @Relationship(deleteRule: .cascade, inverse: \DirectMessage.recipient)
    var receivedMessages: [DirectMessage] = []
    
    @Relationship(deleteRule: .cascade, inverse: \APIToken.user)
    var apiTokens: [APIToken] = []
    
    @Relationship(deleteRule: .cascade, inverse: \UserCertificate.user)
    var certificates: [UserCertificate] = []
    
    init(username: String, email: String, password: String, displayName: String) {
        self.id = Int.random(in: 1...Int.max) // In real app, use proper ID generation
        self.username = username
        self.email = email
        self.password = password
        self.displayName = displayName
    }
}

@Model
final class UserProfile {
    @Attribute(.unique) var id: Int
    var name: String
    var profileType: ProfileType = .personal
    var isDefault: Bool = false
    var bio: String?
    var avatarUrl: String?
    var bannerUrl: String?
    var themeId: Int?
    var settings: [String: Any]?
    var visibility: String = "public"
    var metadata: [String: Any]?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var customDomain: String?
    var customCSS: String?
    var isActive: Bool = true
    var profileSignature: String? // Cryptographic signature of profile data
    var contentCid: String? // Content identifier (IPFS/CID)
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.profiles)
    var user: User?
    
    @Relationship(deleteRule: .cascade, inverse: \Post.profile)
    var posts: [Post] = []
    
    init(name: String, profileType: ProfileType = .personal) {
        self.id = Int.random(in: 1...Int.max)
        self.name = name
        self.profileType = profileType
    }
}

@Model
final class Post {
    @Attribute(.unique) var id: Int
    var content: String
    var attachmentUrls: [String]?
    var storageProviderId: Int?
    var visibility: String = "public"
    var replyToId: Int?
    var federationId: String?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var metadata: [String: Any]?
    var groupId: Int?
    var requiresToken: Bool = false
    var scheduledFor: Date?
    var expiresAt: Date?
    var location: [String: Any]?
    var editHistory: [String: Any]?
    var customCSS: String?
    var language: String?
    var isOriginal: Bool = true
    var originalPostId: Int?
    var translationLanguage: String?
    var translationType: String = "machine"
    var currentVersion: String = "1.0.0"
    var currentVersionId: Int?
    var contentCid: String? // Content identifier for decentralized storage
    var contentHash: String? // Cryptographic hash of content
    var hashAlgorithm: String = "sha256"
    var signature: String? // Digital signature of the creator
    var encryptionMethod: EncryptionMethod?
    var encryptionParams: [String: Any]?
    var replicatedOn: [String: Any]? // Where content is replicated
    var merkleRoot: String? // For verifiable content trees
    var zkProof: String? // For zero-knowledge proofs
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.posts)
    var user: User?
    
    @Relationship(deleteRule: .nullify, inverse: \UserProfile.posts)
    var profile: UserProfile?
    
    @Relationship(deleteRule: .nullify)
    var replyTo: Post?
    
    @Relationship(deleteRule: .cascade, inverse: \Post.replyTo)
    var replies: [Post] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Like.post)
    var likes: [Like] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Repost.post)
    var reposts: [Repost] = []
    
    @Relationship(deleteRule: .cascade, inverse: \PostVersion.post)
    var versions: [PostVersion] = []
    
    @Relationship(deleteRule: .cascade, inverse: \PostTopic.post)
    var topics: [PostTopic] = []
    
    @Relationship(deleteRule: .cascade, inverse: \PostMedia.post)
    var mediaItems: [PostMedia] = []
    
    @Relationship(deleteRule: .nullify, inverse: \Group.posts)
    var group: Group?
    
    init(content: String, user: User) {
        self.id = Int.random(in: 1...Int.max)
        self.content = content
        self.user = user
    }
}

@Model
final class PostVersion {
    @Attribute(.unique) var id: Int
    var version: String // SEMVER format
    var content: String
    var attachmentUrls: [String]?
    var metadata: [String: Any]?
    var changeType: VersionChangeType
    var changeDescription: String?
    var createdAt: Date = Date()
    var createdById: Int?
    var contentCid: String?
    var contentHash: String?
    var hashAlgorithm: String = "sha256"
    var signature: String?
    var editedById: Int?
    var editReason: String?
    var previousVersion: String?
    var encryptionMethod: EncryptionMethod?
    var encryptionParams: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \Post.versions)
    var post: Post?
    
    init(version: String, content: String, changeType: VersionChangeType) {
        self.id = Int.random(in: 1...Int.max)
        self.version = version
        self.content = content
        self.changeType = changeType
    }
}

@Model
final class Topic {
    @Attribute(.unique) var id: Int
    @Attribute(.unique) var name: String
    @Attribute(.unique) var slug: String
    var description: String?
    var parentId: Int?
    var iconUrl: String?
    var isFeatured: Bool = false
    var postCount: Int = 0
    var followerCount: Int = 0
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var contentCid: String?
    var signature: String?
    var federationId: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify)
    var parent: Topic?
    
    @Relationship(deleteRule: .cascade, inverse: \Topic.parent)
    var children: [Topic] = []
    
    @Relationship(deleteRule: .cascade, inverse: \PostTopic.topic)
    var posts: [PostTopic] = []
    
    init(name: String, slug: String) {
        self.id = Int.random(in: 1...Int.max)
        self.name = name
        self.slug = slug
    }
}

@Model
final class PostTopic {
    @Attribute(.unique) var id: Int
    var createdAt: Date = Date()
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \Post.topics)
    var post: Post?
    
    @Relationship(deleteRule: .nullify, inverse: \Topic.posts)
    var topic: Topic?
    
    init(post: Post, topic: Topic) {
        self.id = Int.random(in: 1...Int.max)
        self.post = post
        self.topic = topic
    }
}

@Model
final class MediaItem {
    @Attribute(.unique) var id: Int
    var storageProviderId: Int?
    var mediaType: String // 'image', 'video', 'audio', 'document'
    var mimeType: String
    var fileName: String
    var fileSize: Int64
    var originalUrl: String
    var contentCid: String?
    var contentHash: String?
    var hashAlgorithm: String = "sha256"
    var width: Int?
    var height: Int?
    var duration: Int? // for videos/audio in seconds
    var thumbnailUrl: String?
    var thumbnailCid: String?
    var mediaStatus: String = "active"
    var processingError: String?
    var altText: String?
    var caption: String?
    var metadata: [String: Any]?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var customHash: String?
    var encryptionMethod: EncryptionMethod?
    var encryptionParams: [String: Any]?
    var signature: String?
    var replicatedOn: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.mediaItems)
    var user: User?
    
    @Relationship(deleteRule: .cascade, inverse: \PostMedia.mediaItem)
    var postMedia: [PostMedia] = []
    
    @Relationship(deleteRule: .cascade, inverse: \MediaTransformation.mediaItem)
    var transformations: [MediaTransformation] = []
    
    init(mediaType: String, mimeType: String, fileName: String, fileSize: Int64, originalUrl: String) {
        self.id = Int.random(in: 1...Int.max)
        self.mediaType = mediaType
        self.mimeType = mimeType
        self.fileName = fileName
        self.fileSize = fileSize
        self.originalUrl = originalUrl
    }
}

@Model
final class PostMedia {
    @Attribute(.unique) var id: Int
    var position: Int = 0
    var createdAt: Date = Date()
    var contentCid: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \Post.mediaItems)
    var post: Post?
    
    @Relationship(deleteRule: .nullify, inverse: \MediaItem.postMedia)
    var mediaItem: MediaItem?
    
    init(post: Post, mediaItem: MediaItem, position: Int = 0) {
        self.id = Int.random(in: 1...Int.max)
        self.post = post
        self.mediaItem = mediaItem
        self.position = position
    }
}

@Model
final class MediaTransformation {
    @Attribute(.unique) var id: Int
    var transformationType: String // 'thumbnail', 'small', 'medium', 'large', 'compressed'
    var url: String
    var contentCid: String?
    var width: Int?
    var height: Int?
    var fileSize: Int64?
    var quality: Int?
    var format: String?
    var createdAt: Date = Date()
    var contentHash: String?
    var hashAlgorithm: String = "sha256"
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \MediaItem.transformations)
    var mediaItem: MediaItem?
    
    init(transformationType: String, url: String) {
        self.id = Int.random(in: 1...Int.max)
        self.transformationType = transformationType
        self.url = url
    }
}

@Model
final class Follow {
    @Attribute(.unique) var id: Int
    var createdAt: Date = Date()
    var accepted: Bool = false
    var signature: String?
    var followCredential: String?
    var followCid: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.following)
    var follower: User?
    
    @Relationship(deleteRule: .nullify, inverse: \User.followers)
    var following: User?
    
    init(follower: User, following: User) {
        self.id = Int.random(in: 1...Int.max)
        self.follower = follower
        self.following = following
    }
}

@Model
final class Like {
    @Attribute(.unique) var id: Int
    var createdAt: Date = Date()
    var signature: String?
    var likeCid: String?
    var postVersion: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.likes)
    var user: User?
    
    @Relationship(deleteRule: .nullify, inverse: \Post.likes)
    var post: Post?
    
    init(user: User, post: Post) {
        self.id = Int.random(in: 1...Int.max)
        self.user = user
        self.post = post
    }
}

@Model
final class Repost {
    @Attribute(.unique) var id: Int
    var createdAt: Date = Date()
    var signature: String?
    var repostCid: String?
    var postVersion: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.reposts)
    var user: User?
    
    @Relationship(deleteRule: .nullify, inverse: \Post.reposts)
    var post: Post?
    
    init(user: User, post: Post) {
        self.id = Int.random(in: 1...Int.max)
        self.user = user
        self.post = post
    }
}

@Model
final class Group {
    @Attribute(.unique) var id: Int
    var name: String
    @Attribute(.unique) var slug: String
    var description: String?
    var visibility: String = "public"
    var joinMode: String = "request"
    var federationEnabled: Bool = true
    var federationId: String?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var settings: [String: Any]?
    var avatarUrl: String?
    var bannerUrl: String?
    var contentCid: String?
    var signature: String?
    var encryptionMethod: EncryptionMethod?
    var encryptionParams: [String: Any]?
    var governanceModel: String = "centralized"
    var governanceRules: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.createdGroups)
    var creator: User?
    
    @Relationship(deleteRule: .cascade, inverse: \UserGroupMembership.group)
    var memberships: [UserGroupMembership] = []
    
    @Relationship(deleteRule: .cascade, inverse: \Group.posts)
    var posts: [Post] = []
    
    init(name: String, slug: String, creator: User) {
        self.id = Int.random(in: 1...Int.max)
        self.name = name
        self.slug = slug
        self.creator = creator
    }
}

@Model
final class UserGroupMembership {
    var role: String = "member"
    var joinedAt: Date = Date()
    var invitedById: Int?
    var status: String = "active"
    var signature: String?
    var membershipCredential: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.groupMemberships)
    var user: User?
    
    @Relationship(deleteRule: .nullify, inverse: \Group.memberships)
    var group: Group?
    
    init(user: User, group: Group) {
        self.user = user
        self.group = group
    }
}

@Model
final class DirectMessage {
    @Attribute(.unique) var id: Int
    var content: String
    var mediaIds: [Int]?
    var readAt: Date?
    var encryptionMethod: EncryptionMethod = .aes256gcm
    var encryptionParams: [String: Any]?
    var publicMetadata: [String: Any]?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var deletedBySender: Bool = false
    var deletedByRecipient: Bool = false
    var messageCid: String?
    var forwardSecrecy: Bool = true
    var signature: String?
    var verificationProof: String?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.sentMessages)
    var sender: User?
    
    @Relationship(deleteRule: .nullify, inverse: \User.receivedMessages)
    var recipient: User?
    
    init(content: String, sender: User, recipient: User) {
        self.id = Int.random(in: 1...Int.max)
        self.content = content
        self.sender = sender
        self.recipient = recipient
    }
}

@Model
final class APIToken {
    @Attribute(.unique) var id: Int
    var token: String
    var name: String
    var scope: String
    var lastUsedAt: Date?
    var expiresAt: Date?
    var createdAt: Date = Date()
    var isActive: Bool = true
    var ipWhitelist: [String]?
    var version: String = "1.0.0"
    var currentVersionId: Int?
    var encryptionMethod: EncryptionMethod = .bcrypt
    var encryptionParams: [String: Any]?
    var tokenHash: String?
    var rotationPeriod: TimeInterval?
    var lastRotatedAt: Date?
    var permissionsSchema: [String: Any]?
    var tokenMetadata: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.apiTokens)
    var user: User?
    
    @Relationship(deleteRule: .cascade, inverse: \TokenVersion.token)
    var versions: [TokenVersion] = []
    
    init(token: String, name: String, scope: String, user: User) {
        self.id = Int.random(in: 1...Int.max)
        self.token = token
        self.name = name
        self.scope = scope
        self.user = user
    }
}

@Model
final class TokenVersion {
    @Attribute(.unique) var id: Int
    var version: String
    var createdAt: Date = Date()
    var changeType: VersionChangeType
    var changeDescription: String?
    var createdById: Int?
    var permissions: [String: Any]?
    var tokenHash: String?
    var isDeprecated: Bool = false
    var deprecationReason: String?
    var successorVersion: String?
    var metadata: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \APIToken.versions)
    var token: APIToken?
    
    init(version: String, changeType: VersionChangeType, token: APIToken) {
        self.id = Int.random(in: 1...Int.max)
        self.version = version
        self.changeType = changeType
        self.token = token
    }
}

@Model
final class UserCertificate {
    @Attribute(.unique) var id: Int
    var name: String
    var description: String?
    var publicKey: String
    var privateKey: String? // Should be encrypted
    var certificate: String?
    var fingerprint: String
    var issuedAt: Date
    var expiresAt: Date
    var status: CertificateStatus = .active
    var issuer: String?
    var isDefault: Bool = false
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var metadata: [String: Any]?
    var encryptionMethod: EncryptionMethod = .aes256gcm
    var encryptionParams: [String: Any]?
    var version: String = "1.0.0"
    var certificateType: String = "x509"
    var keyType: String = "rsa"
    var keySize: Int?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \User.certificates)
    var user: User?
    
    @Relationship(deleteRule: .cascade, inverse: \CertificateVersion.certificate)
    var versions: [CertificateVersion] = []
    
    init(name: String, publicKey: String, fingerprint: String, issuedAt: Date, expiresAt: Date) {
        self.id = Int.random(in: 1...Int.max)
        self.name = name
        self.publicKey = publicKey
        self.fingerprint = fingerprint
        self.issuedAt = issuedAt
        self.expiresAt = expiresAt
    }
}

@Model
final class CertificateVersion {
    @Attribute(.unique) var id: Int
    var version: String
    var publicKey: String
    var privateKey: String?
    var certificate: String?
    var fingerprint: String
    var issuedAt: Date
    var expiresAt: Date
    var createdAt: Date = Date()
    var changeType: VersionChangeType
    var changeDescription: String?
    var createdById: Int?
    var encryptionMethod: EncryptionMethod = .aes256gcm
    var encryptionParams: [String: Any]?
    
    // Relationships
    @Relationship(deleteRule: .nullify, inverse: \UserCertificate.versions)
    var certificate: UserCertificate?
    
    init(version: String, publicKey: String, fingerprint: String, issuedAt: Date, expiresAt: Date, changeType: VersionChangeType) {
        self.id = Int.random(in: 1...Int.max)
        self.version = version
        self.publicKey = publicKey
        self.fingerprint = fingerprint
        self.issuedAt = issuedAt
        self.expiresAt = expiresAt
        self.changeType = changeType
    }
}

// MARK: - Additional Models (Abbreviated for brevity)

@Model
final class UserWallet {
    @Attribute(.unique) var id: Int
    var walletAddress: String
    var walletType: String // 'ethereum', 'solana', etc.
    var displayName: String?
    var isVerified: Bool = false
    var verificationDate: Date?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var signature: String?
    var verificationMethod: String?
    
    @Relationship(deleteRule: .nullify)
    var user: User?
    
    init(walletAddress: String, walletType: String) {
        self.id = Int.random(in: 1...Int.max)
        self.walletAddress = walletAddress
        self.walletType = walletType
    }
}

@Model
final class DigitalAsset {
    @Attribute(.unique) var id: Int
    var assetType: String // 'nft', 'token', etc.
    var contractAddress: String?
    var tokenId: String?
    var blockchain: String
    var metadata: [String: Any]
    var name: String?
    var description: String?
    var imageUrl: String?
    var externalUrl: String?
    var isVerified: Bool = false
    var lastVerified: Date?
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    var contentCid: String?
    var assetSignature: String?
    var version: String = "1.0.0"
    
    @Relationship(deleteRule: .nullify)
    var owner: User?
    
    init(assetType: String, blockchain: String, metadata: [String: Any]) {
        self.id = Int.random(in: 1...Int.max)
        self.assetType = assetType
        self.blockchain = blockchain
        self.metadata = metadata
    }
}

// MARK: - Extension for User relationships
extension User {
    @Relationship(deleteRule: .cascade, inverse: \Repost.user)
    var reposts: [Repost] = []
}

// MARK: - Usage Example
/*
// Creating a new user
let user = User(username: "johndoe", email: "john@example.com", password: "hashedPassword", displayName: "John Doe")

// Creating a post
let post = Post(content: "Hello, decentralized world!", user: user)

// Creating a like
let like = Like(user: user, post: post)

// SwiftData container configuration
let container = ModelContainer(for: [
    User.self,
    UserProfile.self,
    Post.self,
    PostVersion.self,
    Topic.self,
    MediaItem.self,
    Follow.self,
    Like.self,
    Repost.self,
    Group.self,
    DirectMessage.self,
    APIToken.self,
    UserCertificate.self,
    UserWallet.self,
    DigitalAsset.self
])
*/

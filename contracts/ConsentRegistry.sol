// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ConsentChain research-data consent registry
/// @notice Stores consent metadata and hashes only. Personal or research data must remain off-chain.
contract ConsentRegistry {
    address public immutable administrator;
    uint256 public consentCount;

    struct Researcher {
        string organization;
        bool active;
    }

    struct Consent {
        uint256 id;
        address patient;
        address researcher;
        bytes32 subjectReference;
        bytes32 purposeHash;
        string dataCategory;
        uint64 issuedAt;
        uint64 expiresAt;
        uint64 revokedAt;
    }

    mapping(address => Researcher) public researchers;
    mapping(uint256 => Consent) private consents;
    mapping(address => uint256[]) private patientConsentIds;
    mapping(address => uint256[]) private researcherConsentIds;

    event ResearcherStatusChanged(address indexed researcher, string organization, bool active);
    event ConsentGranted(
        uint256 indexed consentId,
        address indexed patient,
        address indexed researcher,
        bytes32 subjectReference,
        bytes32 purposeHash,
        string dataCategory,
        uint64 expiresAt
    );
    event ConsentRevoked(uint256 indexed consentId, address indexed patient, uint64 revokedAt);

    error OnlyAdministrator();
    error InvalidAddress();
    error ResearcherNotActive();
    error InvalidExpiry();
    error EmptyField();
    error ConsentNotFound();
    error OnlyPatient();
    error AlreadyRevoked();

    modifier onlyAdministrator() {
        if (msg.sender != administrator) revert OnlyAdministrator();
        _;
    }

    constructor() {
        administrator = msg.sender;
    }

    function setResearcher(address researcher, string calldata organization, bool active)
        external
        onlyAdministrator
    {
        if (researcher == address(0)) revert InvalidAddress();
        if (bytes(organization).length == 0) revert EmptyField();
        researchers[researcher] = Researcher(organization, active);
        emit ResearcherStatusChanged(researcher, organization, active);
    }

    function grantConsent(
        address researcher,
        bytes32 subjectReference,
        bytes32 purposeHash,
        string calldata dataCategory,
        uint64 expiresAt
    ) external returns (uint256 consentId) {
        if (!researchers[researcher].active) revert ResearcherNotActive();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();
        if (subjectReference == bytes32(0) || purposeHash == bytes32(0) || bytes(dataCategory).length == 0) {
            revert EmptyField();
        }

        consentId = ++consentCount;
        consents[consentId] = Consent({
            id: consentId,
            patient: msg.sender,
            researcher: researcher,
            subjectReference: subjectReference,
            purposeHash: purposeHash,
            dataCategory: dataCategory,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            revokedAt: 0
        });
        patientConsentIds[msg.sender].push(consentId);
        researcherConsentIds[researcher].push(consentId);

        emit ConsentGranted(
            consentId,
            msg.sender,
            researcher,
            subjectReference,
            purposeHash,
            dataCategory,
            expiresAt
        );
    }

    function revokeConsent(uint256 consentId) external {
        Consent storage consent = consents[consentId];
        if (consent.id == 0) revert ConsentNotFound();
        if (consent.patient != msg.sender) revert OnlyPatient();
        if (consent.revokedAt != 0) revert AlreadyRevoked();
        consent.revokedAt = uint64(block.timestamp);
        emit ConsentRevoked(consentId, msg.sender, consent.revokedAt);
    }

    function getConsent(uint256 consentId) external view returns (Consent memory) {
        if (consents[consentId].id == 0) revert ConsentNotFound();
        return consents[consentId];
    }

    function getPatientConsentIds(address patient) external view returns (uint256[] memory) {
        return patientConsentIds[patient];
    }

    function getResearcherConsentIds(address researcher) external view returns (uint256[] memory) {
        return researcherConsentIds[researcher];
    }

    function isConsentValid(uint256 consentId) public view returns (bool) {
        Consent storage consent = consents[consentId];
        return consent.id != 0
            && consent.revokedAt == 0
            && consent.expiresAt > block.timestamp
            && researchers[consent.researcher].active;
    }
}

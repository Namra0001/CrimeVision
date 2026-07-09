CREATE TABLE State (
    StateID INTEGER,
    StateName VARCHAR(255),
    NationalityID INTEGER,
    Active BOOLEAN
);

CREATE TABLE District (
    DistrictID INTEGER,
    DistrictName VARCHAR(255),
    StateID INTEGER,
    Active BOOLEAN
);

CREATE TABLE Unit (
    UnitID INTEGER,
    UnitName VARCHAR(255),
    TypeID INTEGER,
    ParentUnit VARCHAR(255),
    NationalityID INTEGER,
    StateID INTEGER,
    DistrictID INTEGER,
    Active BOOLEAN
);

CREATE TABLE Court (
    CourtID INTEGER,
    CourtName VARCHAR(255),
    DistrictID INTEGER,
    StateID INTEGER,
    Active BOOLEAN
);

CREATE TABLE Rank (
    RankID INTEGER,
    RankName VARCHAR(255),
    Hierarchy INTEGER,
    Active BOOLEAN
);

CREATE TABLE Designation (
    DesignationID INTEGER,
    DesignationName VARCHAR(255),
    Active BOOLEAN,
    SortOrder INTEGER
);

CREATE TABLE CasteMaster (
    caste_master_id INTEGER,
    caste_master_name VARCHAR(255)
);

CREATE TABLE ReligionMaster (
    ReligionID INTEGER,
    ReligionName VARCHAR(255)
);

CREATE TABLE OccupationMaster (
    OccupationID INTEGER,
    OccupationName VARCHAR(255)
);

CREATE TABLE EducationMaster (
    EducationID INTEGER,
    EducationName VARCHAR(255)
);

CREATE TABLE CaseStatusMaster (
    CaseStatusID INTEGER,
    CaseStatusName VARCHAR(255)
);

CREATE TABLE CaseCategory (
    CaseCategoryID INTEGER,
    LookupValue VARCHAR(255)
);

CREATE TABLE GravityOffence (
    GravityOffenceID INTEGER,
    LookupValue VARCHAR(255)
);

CREATE TABLE CrimeHead (
    CrimeHeadID INTEGER,
    CrimeGroupName VARCHAR(255),
    Active INTEGER
);

CREATE TABLE CrimeSubHead (
    CrimeSubHeadID INTEGER,
    CrimeHeadID INTEGER,
    CrimeHeadName VARCHAR(255),
    SeqID INTEGER
);

CREATE TABLE Act (
    ActCode VARCHAR(255),
    ActDescription VARCHAR(255),
    ShortName VARCHAR(255),
    Active INTEGER
);

CREATE TABLE Section (
    SectionCode VARCHAR(255),
    ActCode VARCHAR(255),
    SectionDescription VARCHAR(255),
    Active INTEGER
);

CREATE TABLE Employee (
    EmployeeID INTEGER,
    DistrictID INTEGER,
    UnitID INTEGER,
    RankID INTEGER,
    DesignationID INTEGER,
    KGID VARCHAR(255),
    FirstName VARCHAR(255),
    EmployeeDOB VARCHAR(255),
    GenderID INTEGER,
    BloodGroupID INTEGER,
    PhysicallyChallenged BOOLEAN,
    AppointmentDate VARCHAR(255)
);

CREATE TABLE CaseMaster (
    CaseMasterID INTEGER,
    CrimeNo VARCHAR(255),
    CaseNo VARCHAR(255),
    CrimeRegisteredDate VARCHAR(255),
    PolicePersonID INTEGER,
    PoliceStationID INTEGER,
    CaseCategoryID INTEGER,
    GravityOffenceID INTEGER,
    CrimeMajorHeadID INTEGER,
    CrimeMinorHeadID INTEGER,
    CaseStatusID INTEGER,
    CourtID INTEGER,
    IncidentFromDate VARCHAR(255),
    IncidentToDate VARCHAR(255),
    InfoReceivedPSDate VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    BriefFacts VARCHAR(255),
    Village VARCHAR(255),
    Taluk VARCHAR(255)
);

CREATE TABLE ActSectionAssociation (
    CaseMasterID INTEGER,
    ActID VARCHAR(255),
    SectionID VARCHAR(255),
    ActOrderID INTEGER,
    SectionOrderID INTEGER
);

CREATE TABLE ComplainantDetails (
    ComplainantID INTEGER,
    CaseMasterID INTEGER,
    ComplainantName VARCHAR(255),
    AgeYear INTEGER,
    OccupationID INTEGER,
    ReligionID INTEGER,
    CasteID INTEGER,
    GenderID INTEGER
);

CREATE TABLE Victim (
    VictimMasterID INTEGER,
    CaseMasterID INTEGER,
    VictimName VARCHAR(255),
    AgeYear INTEGER,
    GenderID INTEGER,
    VictimPolice VARCHAR(255)
);

CREATE TABLE Accused (
    AccusedMasterID INTEGER,
    CaseMasterID INTEGER,
    AccusedName VARCHAR(255),
    AgeYear INTEGER,
    GenderID INTEGER,
    PersonID VARCHAR(255),
    RepeatOffender BOOLEAN,
    GangID VARCHAR(255),
    Phone VARCHAR(255)
);

CREATE TABLE ArrestSurrender (
    ArrestSurrenderID INTEGER,
    CaseMasterID INTEGER,
    ArrestSurrenderTypeID INTEGER,
    ArrestSurrenderDate VARCHAR(255),
    ArrestSurrenderStateId INTEGER,
    ArrestSurrenderDistrictId INTEGER,
    PoliceStationID INTEGER,
    IOID INTEGER,
    CourtID INTEGER,
    AccusedMasterID INTEGER,
    IsAccused BOOLEAN,
    IsComplainantAccused BOOLEAN
);

CREATE TABLE VehicleDetails (
    VehicleID INTEGER,
    CaseMasterID INTEGER,
    VehicleType VARCHAR(255),
    VehicleNumber VARCHAR(255),
    Owner VARCHAR(255)
);

CREATE TABLE PropertyDetails (
    PropertyID INTEGER,
    CaseMasterID INTEGER,
    PropertyType VARCHAR(255),
    EstimatedValue INTEGER
);

CREATE TABLE WitnessDetails (
    WitnessID INTEGER,
    CaseMasterID INTEGER,
    WitnessName VARCHAR(255),
    Phone VARCHAR(255)
);

CREATE TABLE ChargesheetDetails (
    ChargesheetID INTEGER,
    CaseMasterID INTEGER,
    Status VARCHAR(255),
    CourtID INTEGER,
    Judge VARCHAR(255),
    FilingDate VARCHAR(255)
);

CREATE TABLE BailDetails (
    BailID INTEGER,
    AccusedMasterID INTEGER,
    BailStatus VARCHAR(255)
);

CREATE TABLE ChargeSheetAccused (
    CSAccusedID INTEGER,
    ChargesheetID INTEGER,
    AccusedMasterID INTEGER
);

CREATE TABLE CaseHistory (
    HistoryID INTEGER,
    CaseMasterID INTEGER,
    UpdateDate VARCHAR(255),
    Remarks VARCHAR(255)
);
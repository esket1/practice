-- DBM - https://www.drawdb.app/editor?shareId=ba3f06afec2a69e25aa2aa3824bdd880


create table if not exists Role
(
    ID_Role serial not null constraint PK_Role primary key,
    Name varchar(50) not null unique
);
create table if not exists Category
(
    ID_Category serial not null constraint PK_Category primary key,
    Name varchar(50) not null unique
);
create table if not exists Location
(
    ID_Location serial not null constraint PK_Location primary key,
    Name varchar(255) not null unique,
    Type varchar(255) not null
);
create table if not exists Status
(
    ID_Status serial not null constraint PK_Status primary key,
    Name varchar(50) not null unique,
    Code varchar(50) not null unique -- available, issued, in_repair, written_off
);
create table if not exists Users
(
    ID_Users serial not null constraint PK_Users primary key,
    Email varchar(255) not null unique,
    Password_hash text not null,
    Name varchar(255) not null,
    Last_name varchar(255) not null,
    Middle_name varchar(255) default null,
    Created_at timestamptz not null default now(),
    Role_ID int not null references Role (ID_Role)
);
create index if not exists index_Users_Role on Users (Role_ID);
create unique index if not exists unique_Users_Email_lower on Users (lower(Email)); -- email без учёта регистра
create table if not exists Equipment
(
    ID_Equipment serial not null constraint PK_Equipment primary key,
    Name varchar(255) not null,
    Inventory_number varchar(255) not null unique,
    Photo_url text default null,
    Created_at timestamptz not null default now(),
    Status_ID int not null references Status (ID_Status),
    Category_ID int not null references Category(ID_Category),
    Location_ID int not null references Location(ID_Location)
);
create index if not exists index_Equipment_Status on Equipment (Status_ID);
create index if not exists index_Equipment_Category on Equipment (Category_ID);
create index if not exists index_Equipment_Location on Equipment (Location_ID);
create index if not exists index_Equipment_Inventory_number on Equipment (Inventory_number); -- US/AC 4
create index if not exists index_Equipment_Name on Equipment (Name); -- US/AC 4
create table if not exists Assignment
(
    ID_Assignment serial not null constraint PK_Assignment primary key,
    Due_at timestamptz not null,
    Created_at timestamptz not null default now(),
    Equipment_ID int not null references Equipment (ID_Equipment),
    Users_ID int not null references Users (ID_Users),
    Issued_by_ID int not null references Users (ID_Users)
);
create index if not exists index_Assignment_Equipment on Assignment (Equipment_ID);
create index if not exists index_Assignment_Users on Assignment (Users_ID);
create index if not exists index_Assignment_Issued_by on Assignment (Issued_by_ID);
create index if not exists index_Assignment_Due_at on Assignment (Due_at); -- просрочки, US/AC 7 и 9
create table if not exists Return
(
    ID_Return serial not null constraint PK_Return primary key,
    Created_at timestamptz not null default now(),
    Assignment_ID int not null references Assignment (ID_Assignment) unique,
    Users_ID int not null references Users (ID_Users) -- кто вернул
);
create index if not exists index_Return_Assignment on Return (Assignment_ID);
create index if not exists index_Return_Users on Return (Users_ID);
create table if not exists UserBlock
(
    ID_UserBlock serial not null constraint PK_UserBlock primary key,
    Reason varchar(255) not null,
    Blocked_at timestamptz not null default now(),
    Users_ID int not null references Users (ID_Users),
    Blocked_by_ID int not null references Users (ID_Users)
);
create index if not exists index_UserBlock_Users on UserBlock (Users_ID);
create index if not exists index_UserBlock_Blocked_by_ID on UserBlock (Blocked_by_ID);
create table if not exists UserUnblock
(
    ID_UserUnblock serial not null constraint PK_UserUnblock primary key,
    Reason varchar(255) not null,
    Unblocked_at timestamptz not null default now(),
    UserBlock_ID int not null references UserBlock (ID_UserBlock) unique,
    Users_ID int not null references Users (ID_Users) -- кто разбанил
);
create index if not exists index_UserUnblock_UserBlock on UserUnblock (UserBlock_ID);
create index if not exists index_UserUnblock_Users on UserUnblock (Users_ID);
create table if not exists LocationLog
(
    ID_LocationLog serial not null constraint PK_LocationLog primary key,
    Created_at timestamptz not null default now(),
    Equipment_ID int not null references Equipment (ID_Equipment),
    Users_ID int not null references Users (ID_Users),
    OldLocation_ID int not null references Location (ID_Location),
    NewLocation_ID int not null references Location (ID_Location)
);
create index if not exists index_LocationLog_Equipment on LocationLog (Equipment_ID);
create index if not exists index_LocationLog_Users on LocationLog (Users_ID);
create index if not exists index_LocationLog_OldLocation on LocationLog (OldLocation_ID);
create index if not exists index_LocationLog_NewLocation on LocationLog (NewLocation_ID);
create table if not exists StatusLog
(
    ID_StatusLog serial not null constraint PK_StatusLog primary key,
    Created_at timestamptz not null default now(),
    Equipment_ID int not null references Equipment (ID_Equipment),
    Users_ID int not null references Users (ID_Users),
    OldStatus_ID int not null references Status (ID_Status),
    NewStatus_ID int not null references Status (ID_Status)
);
create index if not exists index_StatusLog_Equipment on StatusLog (Equipment_ID);
create index if not exists index_StatusLog_Users on StatusLog (Users_ID);
create index if not exists index_StatusLog_OldStatus on StatusLog (OldStatus_ID);
create index if not exists index_StatusLog_NewStatus on StatusLog (NewStatus_ID);
create table if not exists RefreshToken
(
    ID_RefreshToken serial not null constraint PK_RefreshToken primary key,
    Token_hash text not null unique,
    Expires_at timestamptz not null,
    Created_at timestamptz not null default now(),
    Users_ID int not null references Users (ID_Users) on delete cascade
);
create index if not exists index_RefreshToken_Users on RefreshToken (Users_ID);


alter table Assignment add constraint CK_Assignment_Due check (Due_at > Created_at);
alter table UserBlock add constraint CK_UserBlock_Self check (Users_ID <> Blocked_by_ID);
alter table LocationLog add constraint CK_LocationLog_Diff check (OldLocation_ID <> NewLocation_ID);
alter table StatusLog add constraint CK_StatusLog_Diff check (OldStatus_ID <> NewStatus_ID);
-- create table if not exists 
-- (

-- );
-- create table if not exists 
-- (

-- );
-- create index if not exists index_Company_Type on Company_Type (Company_Type);
-- DBM - https://www.drawdb.app/editor?shareId=ba3f06afec2a69e25aa2aa3824bdd880


create table if not exists Role
(
    ID_Role serial not null constraint PK_Role primary key,
    Role varchar(50) not null
);
create index if not exists
create table if not exists Category
(
    ID_Category serial not null constraint PK_Category primary key,
    Category varchar(50) not null
);
create table if not exists Location
(
    ID_Location serial not null constraint PK_Location primary key,
    Name varchar(255) not null,
    Type varchar(255) not null
);
create table if not exists Status
(
    ID_Status serial not null constraint PK_Status primary key,
    Status varchar(50) not null
);
create table if not exists User
(
    ID_User serial not null constraint PK_User primary key,
    email varchar(255) not null,
    password_hash text not null,
    name varchar(255) not null,
    last_name varchar(255) not null,
    middle_name varchar(255) not null,
    created_at timestamptz not null,
    role_ID int not null references Role (ID_Role)

);
create table if not exists Equipment
(
    ID_Equipment serial not null constraint PK_Equipment primary key,
    name varchar(255) not null,
    inventory_number varchar(255) not null unique,
    photo_url text default null,
    status_ID int not null references Status (ID_Status),
    Category_ID int not null references Category(ID_Category),
    Location_ID int not null references Location(ID_Location),
    Created_at timestamptz not null default now()
);
create table if not exists Assignment
(
    ID_Assignment serial not null constraint PK_Assignment primary key,
    Equipment_ID int not null references Equipment (ID_Equipment),
    User_ID int not null references User (ID_User),
    Created_at timestamptz not null default now(),
    Due_at timestamptz default null,
    Issued_by_ID int not null references User (ID_User)
);
create table if not exists Return
(
    ID_Reeturn serial not null constraint PK_Return primary key,
    Assignment_ID int not null references Assignment (ID_Assignment),
    Created_at timestamptz not null default now(),
    Accepted_by_ID int not null references User (ID_User)
);
create table if not exists UserBlock
(
    ID_UserBlock serial not null constraint PK_UserBlock primary key,
    User_ID int not null references User (ID_User)
);
create table if not exists 
(

);
create table if not exists 
(

);
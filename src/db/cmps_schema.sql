-- mysql

-- This is the schema for our database

CREATE TABLE course (
    subj VARCHAR(30), -- subj is subject like CMPS
    code varchar(20), -- code is course numbering like 200
    title VARCHAR(30),
    attribute VARCHAR(40),
    description text,
    PRIMARY KEY (subj, code)
);

CREATE TABLE prerequisite (
    forsubj VARCHAR(30),
    forcode VARCHAR(20),
    reqsubj VARCHAR(30),
    reqcode VARCHAR(20),
    PRIMARY KEY (forsubj, forcode, reqsubj, reqcode),
    FOREIGN KEY (forsubj, forcode) REFERENCES course(subj, code),
    FOREIGN KEY (reqsubj, reqcode) REFERENCES course(subj, code)
);

CREATE TABLE building (
    bldgname VARCHAR(20),
    alias VARCHAR(20),
    image_url TEXT,
    PRIMARY KEY (bldgname)
);

CREATE TABLE room (
    bldgname VARCHAR(20),
    roomcode VARCHAR(20),
    PRIMARY KEY (bldgname, roomcode),
    FOREIGN KEY (bldgname) REFERENCES building(bldgname)
);

CREATE TABLE instructor (
    email VARCHAR(30),
    first_name VARCHAR(20),
    last_name VARCHAR(20),
    title VARCHAR(100),
    department VARCHAR(60),
    office_days VARCHAR(3),
    office_starting_hour TIME,
    office_ending_hour TIME,
    bldgname VARCHAR(20),
    roomcode VARCHAR(20),
    image_url TEXT,
    CONSTRAINT instructor_id PRIMARY KEY (email),
    CONSTRAINT office_room FOREIGN KEY (bldgname, roomcode) REFERENCES room(bldgname, roomcode)
);

CREATE TABLE lecture (
    crn int,
    semester VARCHAR(12),
    lec_year int, -- year when the lecture was being taught
    lec_days VARCHAR(3), -- days per week of lecture
    starting_hour TEXT,
    ending_hour TEXT,
    section varchar(5),
    credits int,
    subj VARCHAR(30),
    code VARCHAR(20),
    bldgname VARCHAR(20),
    roomcode varchar(20),
    instructor_email VARCHAR(30),
    CONSTRAINT lecture_id PRIMARY KEY (crn, semester, lec_year),
    CONSTRAINT course_link FOREIGN KEY (subj, code) REFERENCES course(subj, code),
    CONSTRAINT room_link FOREIGN KEY (bldgname, roomcode) REFERENCES room(bldgname, roomcode),
    CONSTRAINT instructor_link FOREIGN KEY (instructor_email) REFERENCES instructor(email)
);

CREATE TABLE client ( -- user is a reserved keyword
    fid bigint unsigned, -- facebook id
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    CONSTRAINT facebook_id PRIMARY KEY (fid)
);

CREATE TABLE issue (
    fid bigint unsigned,
    msgno int,
    text VARCHAR(100),
    CONSTRAINT issue_id PRIMARY KEY (fid, msgno),
    CONSTRAINT issue_client FOREIGN KEY (fid) REFERENCES client(fid)
);

CREATE TABLE material (
    title VARCHAR(80),
    date_published TEXT,
    fid bigint unsigned,
    subj VARCHAR(30),
    code VARCHAR(20),
    CONSTRAINT material_id PRIMARY KEY (title),
    CONSTRAINT contributor FOREIGN KEY (fid) REFERENCES client(fid),
    CONSTRAINT material_course FOREIGN KEY (subj, code) REFERENCES course(subj, code)
);

CREATE TABLE tutor (
    fid bigint unsigned,
    tutor_name VARCHAR(45),
    seniority VARCHAR(20),
    gpa float,
    tutor_desc TEXT, -- tutor description
    website VARCHAR(100),
    phone_no VARCHAR(30),
    email VARCHAR(30),
    CONSTRAINT tutor_id PRIMARY KEY (fid),
    CONSTRAINT client_link FOREIGN KEY (fid) REFERENCES client(fid)
);

CREATE TABLE teaches (
    fid bigint unsigned,
    subj VARCHAR(30),
    code VARCHAR(20),
    price int,
    speciality VARCHAR(60),
    CONSTRAINT teaching PRIMARY KEY (fid, subj, code),
    CONSTRAINT tutor_link FOREIGN KEY (fid) REFERENCES tutor(fid),
    CONSTRAINT teaches_course_link FOREIGN KEY (subj, code) REFERENCES course(subj, code)
);

CREATE TABLE tip (
    fid bigint unsigned,
    post_id int,
    category VARCHAR(30),
    content TEXT,
    CONSTRAINT tip_id PRIMARY KEY (fid, post_id),
    CONSTRAINT tip_client_link FOREIGN KEY (fid) REFERENCES client(fid)
);


CREATE TABLE agreement (
    client_id bigint unsigned,
    author_id bigint unsigned,
    post_id int,
    agree boolean,
    CONSTRAINT agreement PRIMARY KEY (client_id, author_id, post_id),
    CONSTRAINT agreement_client_link FOREIGN KEY (client_id) REFERENCES client(fid),
    CONSTRAINT tip_link FOREIGN KEY (author_id, post_id) REFERENCES tip(fid, post_id)
);

CREATE TABLE faculty (
    name VARCHAR(60),
    CONSTRAINT faculty_id PRIMARY KEY (name)
);

CREATE TABLE department (
    name VARCHAR(60),
    faculty_name VARCHAR(60),
    CONSTRAINT department_id PRIMARY KEY (name),
    CONSTRAINT department_faculty_link FOREIGN KEY (faculty_name) REFERENCES faculty(name)
);

CREATE TABLE tuition (
    semester VARCHAR(12),
    year int,
    faculty_name VARCHAR(60),
    degree_level VARCHAR(30),
    credit_cost VARCHAR(30),
    CONSTRAINT tuition_id PRIMARY KEY (semester, year, faculty_name, degree_level),
    CONSTRAINT tuition_faculty_link FOREIGN KEY (faculty_name) REFERENCES faculty(name)
);

CREATE TABLE info (
    tag VARCHAR(30),
    value TEXT,
    image_url TEXT,
    default_action_url TEXT,
    title TEXT,
    CONSTRAINT tag_id PRIMARY KEY (tag)
);

CREATE TABLE studyplan (
    major VARCHAR(30),
    degree_level VARCHAR(30),
    value TEXT,
    CONSTRAINT studyplan_id PRIMARY KEY (major, degree_level)
);


CREATE TABLE catalogues (
    department VARCHAR(60),
    degree_level VARCHAR(30),
    link text,
    CONSTRAINT catalouges_id PRIMARY KEY (department, degree_level),
    CONSTRAINT department_fk FOREIGN KEY  (department) REFERENCES department(name)
);

CREATE TABLE faqs (
    category VARCHAR(30),
    question TEXT,
    answer TEXT
);
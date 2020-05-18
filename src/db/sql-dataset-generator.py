'''
Authors: Mohammad Naji Kadri, Mazen Natour

Description: This script is designed to convert our csv files dataset which were obtained by scraping
into sql code that can be used to populate our database with data.
'''

import csv
import sys
import configparser # install configparser to read config.ini file

# define necessary classes for the sql generator

class ConfigFile:
    def __init__(self, catalog_file, attribute_file, department_faculty_file,
     tuition_file, instructors_images_file, buildings_file, course_info_file,
     catalogues_file, instructors_office_title_file, info_file, output_file):
        self.catalog_file = f'{catalog_file}.csv'
        self.attribute_file = f'{attribute_file}.csv'
        self.department_faculty_file = f'{department_faculty_file}.csv'
        self.tuition_file = f'{tuition_file}.csv'
        self.instructors_images_file = f'{instructors_images_file}.csv'
        self.buildings_file = f'{buildings_file}.csv'
        self.course_info_file = f'{course_info_file}.csv'
        self.catalogues_file = f'{catalogues_file}.csv'
        self.instructors_office_title_file = f'{instructors_office_title_file}.csv'
        self.info_file = f'{info_file}.csv'
        self.output_file = f'{output_file}.sql'

# define columns in the dataset if it might change later on

class Catalog:
    CRN = 0
    COURSE_SUBJ = 1
    COURSE_CODE = 2
    SECTION = 3
    COURSE_TITLE = 4
    TIME = 5
    DAYS = 6
    INSTRUCTOR = 7
    EMAIL = 8
    BUILDING = 9
    ROOM = 10
    YEAR = 11
    SEMESTER = 12
    CREDITS = 13

class Attribute:
    COURSE_SUBJ = 0
    COURSE_CODE = 1
    ATTRIBUTE = 2

class DepartmentFaculty:
    DEPARTMENT = 0
    FACULTY = 1


class Tuition:
    SEMESTER = 0
    YEAR = 1
    FACULTY = 2
    DEGREE_LEVEL = 3
    CREDIT_COST = 4

class InstructorsImages:
    EMAIL = 0
    SRC = 1

class Buildings:
    BUILDING = 0
    ALIAS = 1
    IMAGE = 2

class CourseInfo:
    SUBJECT = 0
    CODE = 1
    DESCRIPTION = 2

class Catalogues:
    DEPARTMENT = 0
    DEGREE_LEVEL = 1
    LINK = 2

class OfficeTitle:
    EMAIL = 0
    TITLE = 1
    BUILDING = 2
    ROOM = 3

class INFO:
    TAG = 0
    VALUE = 1
    IMAGE_URL = 2
    DEFAULT_ACTION_URL = 3
    TITLE = 4

# substitute building keywords to avoid collision with courses keywords
# example CHEM building and CHEM courses are the same
def substitute(keyword):
    subs = {
        'CHEM': 'CHE',
        'PHYS': 'PHY',
        'BIOL': 'BIO'
    }

    return subs[keyword] if keyword in subs else keyword


# dictionaries to store data to be generated
courses = {}
instuctors = {}
buildings = {}
rooms = {}
lectures = {}
faculties = {}
departments = {}
tuitions = {}
catalogues = {}
info = {}

# load configuration file

ONE_FILE = False # if True generate only a single file instead of multiple ones for each table/relation

if len(sys.argv) > 1:
    ONE_FILE = True if sys.argv[1].lower() == 'true' else False


read_config = configparser.ConfigParser()
read_config.read('config.ini')

config = ConfigFile(
    read_config.get('settings', 'CatalogFile'),
    read_config.get('settings', 'AttributeFile'),
    read_config.get('settings', 'DepartmentFacultyFile'),
    read_config.get('settings', 'TuitionFile'),
    read_config.get('settings', 'InstructorsImagesFile'),
    read_config.get('settings', 'BuildingsFile'),
    read_config.get('settings', 'CourseInfoFile'),
    read_config.get('settings', 'CataloguesFile'),
    read_config.get('settings', 'InstructorsOfficeTitle'),
    read_config.get('settings', 'InfoFile'),
    read_config.get('settings', 'OutputFile')
)

# read dataset and extract information

with open( config.catalog_file , 'r') as csv_file:
    data = csv.reader(csv_file)

    is_header = True 

    for row in data:

        if is_header: # ignore first row ( it is the header)
            is_header = False
            continue

        if row[Catalog.COURSE_CODE][0] == '0':
            # ignore any course/lecture which has a leading zero
            # they seem irrelavent to our required data
            continue 

        course = [row[Catalog.COURSE_SUBJ], row[Catalog.COURSE_CODE], row[Catalog.COURSE_TITLE], 'NULL', 'NULL']
        course_name = row[Catalog.COURSE_SUBJ] + str(row[Catalog.COURSE_CODE])

        instr_name = row[Catalog.INSTRUCTOR]
        email = row[Catalog.EMAIL]

        if not email in instuctors and email != 'N/A' and email != 'NULL':

            if instr_name == 'N/A' or instr_name == 'NULL':
                # note: format is email, first_name, last_name, image_url, title, bldgname, roomcode
                instuctors[email] = [f'"{email}"', 'null','null', 'null', 'null', 'null', 'null']
            else:
                first_name = instr_name.split()[0]
                last_name = ' '.join( instr_name.split()[1:])
                instuctors[email] = [f'"{email}"', f'"{ first_name }"', f'"{  last_name  }"', 'null', 'null', 'null', 'null']

        if course_name != 'NULL' and course_name != 'N/A' and not course_name in courses :
            courses[course_name] = course

        building = substitute(row[Catalog.BUILDING])

        if building != 'N/A' and building != 'NULL' and not building in buildings:
            buildings[building] = [building, 'null', 'null']

        room = row[Catalog.ROOM]

        if room != 'N/A' and room != 'NULL' and not (building + room) in rooms:
            # while len(room) < 3:
            #     room = '0' + room
            rooms[building + room] = (building, room)

        lectures[row[Catalog.CRN]] = tuple(row)


with open( config.attribute_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        course_name = row[Attribute.COURSE_SUBJ] + str(row[Attribute.COURSE_CODE])

        if course_name in courses:
            courses[course_name][-2] = row[Attribute.ATTRIBUTE]

with open( config.department_faculty_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        department = ( row[DepartmentFaculty.DEPARTMENT], row[DepartmentFaculty.FACULTY] )

        departments[ department[DepartmentFaculty.DEPARTMENT] ] = department

        faculty = department[DepartmentFaculty.FACULTY]

        if '-' in faculty:
            fac = faculty.split('-')[0]
            faculties[fac] = fac

        if not faculty in faculties:
            faculties[ faculty ] = faculty


with open( config.tuition_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        row[Tuition.YEAR] = row[Tuition.YEAR].split('-')[1]

        tuition = (row[Tuition.SEMESTER], row[Tuition.YEAR], row[Tuition.FACULTY], row[Tuition.DEGREE_LEVEL])

        if not tuition in tuitions:
            tuitions[tuition] = row


with open( config.instructors_images_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        email = row[InstructorsImages.EMAIL]

        if email in instuctors:
            instuctors[email][3] = f'"{row[InstructorsImages.SRC]}"'

with open( config.instructors_office_title_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        email = row[OfficeTitle.EMAIL]

        if email in instuctors:
            instuctors[email][4] = f'"{row[OfficeTitle.TITLE]}"' if row[OfficeTitle.TITLE] != 'NULL' else instuctors[email][4]
            instuctors[email][5] = f'"{row[OfficeTitle.BUILDING]}"' if row[OfficeTitle.BUILDING] != 'NULL' else instuctors[email][5]
            instuctors[email][6] = f'"{row[OfficeTitle.ROOM]}"' if row[OfficeTitle.ROOM] != 'NULL' else instuctors[email][6]

            building = row[OfficeTitle.BUILDING].upper()
            room = row[OfficeTitle.ROOM].upper()

            if room != 'NULL' and (building + room) not in rooms:
                buildings[building] = [building, 'null', 'null']
                rooms[building+room] = (building, room)

with open( config.buildings_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        bldgame = substitute(row[Buildings.BUILDING])

        if bldgame in buildings:
            if row[Buildings.ALIAS] != '': # make sure that the alias is not empty
                  buildings[bldgame][Buildings.ALIAS] = f'"{row[Buildings.ALIAS]}"'
            buildings[bldgame][Buildings.IMAGE] = f'"{row[Buildings.IMAGE]}"'

with open( config.course_info_file, 'r', encoding='utf-8') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        course_name = row[CourseInfo.SUBJECT] + row [CourseInfo.CODE]

        if course_name in courses:
            courses[course_name][-1] = f'"{row[CourseInfo.DESCRIPTION]}"'


with open( config.catalogues_file , 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        dep = row[Catalogues.DEPARTMENT] + row[Catalogues.DEGREE_LEVEL]

        catalogues[dep] = row

with open( config.info_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        if row[INFO.IMAGE_URL] == 'NULL':
            row[INFO.IMAGE_URL] = 'null'
        else:
            row[INFO.IMAGE_URL] = f'"{row[INFO.IMAGE_URL]}"'
        
        if row[INFO.DEFAULT_ACTION_URL] == 'NULL':
            row[INFO.DEFAULT_ACTION_URL] = 'null'
        else:
            row[INFO.DEFAULT_ACTION_URL] = f'"{row[INFO.DEFAULT_ACTION_URL]}"'

        if row[INFO.TITLE] == 'NULL':
            row[INFO.TITLE] = 'null'
        else:
            row[INFO.TITLE] = f'"{row[INFO.TITLE]}"'

        info[row[INFO.TAG]] = row


# important functions that are used to make transcations faster
# note any sql statements between begin and end will either all be 
# inserted or none of them if there is any error or any problem

def begin (sql_file, name):
    sql_file.write(f"-- facebook_data {name} dataset ( auto-generated )\n\n")

    sql_file.write('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n')
    sql_file.write('SET autocommit = 0;\n\n')

    sql_file.write('START TRANSACTION; \n')

def end (sql_file):
    sql_file.write('\nCOMMIT; \n')
    sql_file.write('set autocommit = 1;')


# convert dataset information to sql statements
# note: we need a better way to transfer data as mysql is different and slower than sqlite

with open( config.output_file if ONE_FILE else 'aub_courses.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'courses')

    # inserting courses

    sql_file.write('-- INSERT COURSES \n\n')

    for course in courses.values():

        if course[3] == 'NULL':
            course[3] = 'null'
        else:
            course[3] = f'"{course[3]}"'

        if course[4] == 'NULL':
            course[4] = 'null'
            
        sql_file.write(f'INSERT INTO course VALUES ("{course[0]}","{str(course[1])}","{course[2]}", {course[3]}, {course[4]});\n')

    end(sql_file)


#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else 'aub_buildings.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'buildings')
    
    # inserting buildings

    sql_file.write('\n-- INSERT BUILDINGS \n\n')

    for bldg in buildings.values():
        sql_file.write(f'INSERT INTO building  VALUES ("{bldg[0]}", {bldg[1]}, {bldg[2]});\n')


    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_rooms.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'rooms')

    # inserting rooms

    sql_file.write('\n-- INSERT ROOMS \n\n')


    for room in rooms.values():
        sql_file.write(f'INSERT INTO room  VALUES ("{room[0]}", "{room[1]}");\n')    
        
    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_instructors.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'instructors')
    
    # inserting instructors

    sql_file.write('\n-- INSERT INSTRUCTORS \n\n')

    for instr in instuctors.values():
        sql_file.write(f'INSERT INTO instructor (email, first_name, last_name, image_url, title, bldgname, roomcode) VALUES ({instr[0]}, {instr[1]}, {instr[2]}, {instr[3]}, {instr[4]}, {instr[5]}, {instr[6]});\n')    
        
    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_lectures.sql' , 'a' if ONE_FILE else 'w' , encoding='utf-8') as sql_file:

    begin(sql_file, 'lectures')
    
    # inserting lectures

    sql_file.write('\n-- INSERT LECTURES \n\n')

    for lecture in lectures.values():
        # check for null values or N/A
        days = lecture[Catalog.DAYS]
        if days == 'N/A' or days == 'NULL':
            days = 'null'
        else:
            days = f'"{days}"'

        time = lecture[Catalog.TIME]
        time = time.split('-')
        if time == ['N/A'] or time == ['NULL']:
            time = ['null', 'null']
        else:
            time[0] = f'"{time[0]}"'
            time[1] = f'"{time[1]}"'

        building = substitute(lecture[Catalog.BUILDING])

        if building == 'N/A' or building == 'NULL':
            building = 'null'
        else:
            building = f'"{building}"'

        room = lecture[Catalog.ROOM]

        if room == 'N/A' or room == 'NULL':
            room = 'null'
        else:
            # while len(room) < 3:
            #     room = '0' + room

            room = f'"{room}"'

        instuctor = lecture[Catalog.INSTRUCTOR]

        email = lecture[Catalog.EMAIL]

        if email == 'N/A' or email == 'NULL':
            email = 'null'
        else:
            email = f'"{email}"'

        # if instuctor == 'N/A':
        #     instuctor = ['null','null']
        # else:
        #     first_name = instuctor.split()[0]
        #     last_name = instuctor.split()[1:]
        #     instuctor = [f'"{first_name}"', f'"{last_name}"']

        # email = lecture[EMAIL]

        

        sql_file.write(f'INSERT INTO lecture VALUES ({str(lecture[0])}, "{lecture[Catalog.SEMESTER]}", {lecture[Catalog.YEAR]}, {days}, {time[0]}, {time[1]}, "{lecture[Catalog.SECTION]}", {lecture[Catalog.CREDITS]} , "{lecture[Catalog.COURSE_SUBJ]}", "{lecture[Catalog.COURSE_CODE]}", {building}, {room}, {email});\n')    
        
    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_faculties.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'faculties')
    
    # inserting faculties

    sql_file.write('\n-- INSERT FACULTIES \n\n')

    for faculty in faculties.values():
        sql_file.write(f'INSERT INTO faculty VALUES ("{faculty}");\n')

    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_departments.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'departments')
    
    # inserting departments

    sql_file.write('\n-- INSERT DEPARTMENTS \n\n')

    for department in departments.values():
        dep = department[ DepartmentFaculty.DEPARTMENT ]
        fac = department[ DepartmentFaculty.FACULTY ]
        sql_file.write(f'INSERT INTO department VALUES ("{dep}", "{fac}");\n')

    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_tuition.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'tuition')

    # inserting tuitions

    sql_file.write('\n-- INSERT TUITION \n\n')

    for tuition in tuitions.values():
        sems = tuition[ Tuition.SEMESTER ]
        year = tuition[ Tuition.YEAR ]
        fac = tuition[ Tuition.FACULTY ]
        deglvl = tuition[ Tuition.DEGREE_LEVEL ]
        crd = tuition[ Tuition.CREDIT_COST ]
        sql_file.write(f'INSERT INTO tuition VALUES ("{sems}", {year}, "{fac}", "{deglvl}", "{crd}");\n')    
        
    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_catalogues.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'catalogues')
    
    # inserting catalogues

    sql_file.write('\n-- INSERT CATALOGUES \n\n')

    for ctlg in catalogues.values():
        sql_file.write(f'INSERT INTO catalogues VALUES ("{ctlg[Catalogues.DEPARTMENT]}", "{ctlg[Catalogues.DEGREE_LEVEL]}", "{ctlg[Catalogues.LINK]}");\n')  

    end(sql_file)

#-------------------------------------------------------------------------------------------

with open( config.output_file if ONE_FILE else  'aub_info.sql' , 'a' if ONE_FILE else 'w', encoding='utf-8') as sql_file:

    begin(sql_file, 'info')

    # inserting info

    sql_file.write('\n-- INSERT INFO \n\n')

    for cinfo in info.values(): # cinfo means current info
        sql_file.write(f'INSERT INTO info VALUES ("{cinfo[0]}", "{cinfo[1]}", {cinfo[2]}, {cinfo[3]}, {cinfo[4]});\n')   
        
    end(sql_file)

#-------------------------------------------------------------------------------------------

print("facebook_bot base dataset sql successfully generated!")
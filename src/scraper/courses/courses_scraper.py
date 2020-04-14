'''
    Author: Mazen Natour

    This program is meant to scrape data from the AUB banner a-z and put them into
    a csv file.
    Another program is used "email_scraper" in order to link Instructors' fullnames 
    to an email when found

'''
from bs4 import BeautifulSoup
import csv
import urllib.request
from email_scraper import InstructorGenerator
import time

t0 = time.time()
# This list contains all the alphabets which is intended to be put in the URL
ALPHABETS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'M', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

# These terms are created to indicate the column index
TERM = 0
CRN = 1
SUBJECT = 2
CODE = 3
SECTION = 4
TITLE = 5
CREDITS = 6
TIME_START = 11
TIME_END = 12
DAYSM = 15
DAYST = 16
DAYSW = 17
DAYSTR = 18
DAYSF = 19
FIRSTNAME = 33
LASTNAME = 34
BUILDING = 13
ROOM = 14
INSTRUCTORS = InstructorGenerator()

# A function which returns a list of tuples each tuple containing the row of info
def make_tuple(alpha):
    lst = []
    new_lst = []
    count = 4                                  # Starting at 4 to ignore first couple of elements
    HTMLINK = 'https://www-banner.aub.edu.lb/catalog/schd_{}.htm'.format(alpha)
    r = urllib.request.urlopen(HTMLINK).read() # reading all the elements inside the html
    soup = BeautifulSoup(r, "html.parser")     # Parsing
    tds = soup.find_all("td")                  # all td elements inside the html file
    for i in range((len(tds) - 4) // 36):      # the range indicate the number of rows
        for each in range(count, count + 36):  # loop over the columns
            a = tds[each].text                 # Get the value of the html tag
            if tds[each].text == ".":          
                a = ""
            lst.append(a)                       
        new_lst.append(lst)                    # appending the list of each row to make list of lists(rows)
        lst = []                               # clearing the inner list(row)
        count += 36                            # incrementing by 36 to start with the next row 
    for i in range(len(new_lst)):              # looping over the list of lists(rows) 
        new_lst[i][TIME_START] =new_lst[i][TIME_START][0:2] + ':' + new_lst[i][TIME_START][2::]
        new_lst[i][TIME_END] =new_lst[i][TIME_END][0:2] + ':' + new_lst[i][TIME_END][2::] 

        if new_lst[i][ROOM] == "":
            new_lst[i][ROOM] = "NULL"
        if new_lst[i][BUILDING] == "":
            new_lst[i][BUILDING] = "NULL"
        if new_lst[i][TIME_START] == ":":
            new_lst[i][TIME_START] = "NULL"
        if new_lst[i][TIME_END] == ":":
            new_lst[i][TIME_END] = "NULL"
        if new_lst[i][FIRSTNAME] == "":
            new_lst[i][FIRSTNAME] = "NULL"
        if new_lst[i][LASTNAME] == "STAFF":
            new_lst[i][LASTNAME] = ""
        
    LST_CSV = []                        # This list is created to append tuples of all the entities of the dataset to it
    a = ()                              # The tuple which will be added to the list above                 
    for rows in range(1, len(new_lst)):
        start = new_lst[rows][TIME_START]
        end = new_lst[rows][TIME_END]
        TIME = start + "-" + end
        DAYS = new_lst[rows][DAYSM] +  new_lst[rows][DAYST] + new_lst[rows][DAYSW] + new_lst[rows][DAYSTR] + new_lst[rows][DAYSF]
        if DAYS == "":
            DAYS = "NULL"
        if end == "NULL":
            TIME = "NULL"
        YEAR = new_lst[rows][TERM]
        SEMESTER = new_lst[rows][TERM]
        NEW_ROOM = new_lst[rows][ROOM]
        if YEAR[0] == "F":               # Checking whether the term is fall so we can take the year of the course
            YEAR = YEAR[10:14]
        if YEAR[0] == "S":               # Checking whether the term is spring so we can take the year of the course
            YEAR = YEAR[12:16]
        if SEMESTER[0] == "F":           # Checking whether the term is fall so we can set the semester to Fall
            SEMESTER = SEMESTER[0:4]
        if SEMESTER[0] == "S":           # Checking whether the term is spring so we can set the semester to Spring
            SEMESTER = SEMESTER[0:6]
        if NEW_ROOM[0] == "0" and NEW_ROOM[1] != "0":  # To remove the first zero digit due to problems adding numbers starting with zero
            NEW_ROOM = NEW_ROOM[1::]
        if NEW_ROOM[0] == "0" and NEW_ROOM[1] == "0":  # To remove the first two zero digit due to problems adding numbers starting with zero
            NEW_ROOM = NEW_ROOM[2]
        FULLNAME = new_lst[rows][FIRSTNAME] + " " + new_lst[rows][LASTNAME]
        EMAIL = "NULL"                  # Setting emails to Null
        if FULLNAME in INSTRUCTORS:
            EMAIL = INSTRUCTORS[FULLNAME]
        # setting every entity in a row of the dataset inside a tuple
        a = (new_lst[rows][CRN], new_lst[rows][SUBJECT],new_lst[rows][CODE],new_lst[rows][SECTION],new_lst[rows][TITLE], TIME, DAYS,new_lst[rows][FIRSTNAME] + " " + new_lst[rows][LASTNAME] , EMAIL , new_lst[rows][BUILDING],NEW_ROOM, YEAR, SEMESTER, new_lst[rows][CREDITS])
        LST_CSV.append(a)   # appending the row to the new list
    return LST_CSV
def make_csv():
    with open('aub_catalog_dataset.csv', mode='w', newline = '') as file_: # opening a new csv or existing one
        file_ = csv.writer(file_)
        # The first row of the dataset
        file_.writerow(("CRN", "Subject", "Code", "Section", "Title", "Time", "Days", "Instructor", "Email" , "Building", "Room", "Year", "Semester", "Credit Hours"))
        for alphabets in ALPHABETS:    # looping over all the alphabets
            for i in make_tuple(alphabets):   # creating a list of tuples(rows) and looping over it 
                file_.writerow(i)           # writing every tuple inside the list into the csv file
make_csv()


t1 = time.time()
total = t1 - t0
print(total)
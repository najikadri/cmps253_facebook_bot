# This program is intended to return a dictionary
# This dictionary has name of the course and code as keys
# And the attribute as values

from selenium import webdriver
from bs4 import BeautifulSoup
import csv
import urllib.request
import time

# Column numbers starting from 0
SUBJECT = 2
COURSE_NUM = 3
COURSE_ATTR = 4

# Select (*) name according to the website
select_term_name = "arg1"
select_subject_name = "arg2"
select_attribute_name = "arg3"

# Term option value
spring_2019_2020 = "Spring 2019-2020" # We will use this value for now
summer_2019_2020 = "Summer 2019-2020"
fall_2020_2021 = "Fall 2020-2021"
spring_code = "202020"
fall_code = "202110"

# A list of available value of attributes
# ARCS -> Arabic Communication Skills
# ENCS -> English Communication Skills
# HUMN -> Humanites I
# HUM1 -> Humanities II
# NACS -> Natural Sciences
# QNTH -> Quantitative Thought
# SOSC -> Social Sciences I
# SOS1 -> Social Sciences II
attribute_values_list = ["ARCS", "ENCS", "HUMN", "HUM1", "NASC", "QNTH", "SOSC", "SOC1"]

# Submit type and value are submit and Submit respectively
submit_type = "submit"
submit_value = "Submit"

# Google Chrome driver
driver = webdriver.Chrome(executable_path=r"C:\bin\chromedriver.exe")

# Openning Google Chrome and going to General courses website
url = "https://www-banner.aub.edu.lb/pls/weba/aubqueries.P_GenEducDispArguments"
driver.get(url)
def submit():
    sub = driver.find_element_by_css_selector("input")
    sub.click()

def select_term(term, term_option_select):
    selects = driver.find_element_by_name(term_option_select)
    for options in selects.find_elements_by_tag_name("option"):
        if options.text == term:
            options.click()

def get_courses_by_attribute(term, term_code, term_select):
    select_term(term, term_select)
    submit()
    time.sleep(1)
    new_url = driver.current_url + "/?arg1={}&arg2=&arg3=&output_to=HTML".format(term_code)
    
    new_r = urllib.request.urlopen(new_url)
    
    soup = BeautifulSoup(new_r, "html.parser")
    tds = soup.find_all("td")
    count = 6 # number of attributes in each row
    row_list = []
    main_list = []

    for i in range((len(tds) - 6)//18):
        for each in range(count, count + 18):
            row_list.append(tds[each].text.strip())
        main_list.append(row_list)
        row_list = []
        count += 18
    # now we have a main_list whic contains list of each row
    # Now we create a dictionary for courses as keys and attributes as values
    COURSES_DICT = {}
    for i in range(len(main_list)):
        COURSES_DICT[main_list[i][SUBJECT] + " " + str(main_list[i][COURSE_NUM])] = main_list[i][COURSE_ATTR]
    return COURSES_DICT



def make_csv():
    with open('courses_attributes.csv', mode = 'w', newline = '') as file_:
        file_ = csv.writer(file_)
        file_.writerow(("Subject", "Code", "Attribute"))
        COURSES_DICT = get_courses_by_attribute("Spring 2019-2020", spring_code , "arg1")
        time.sleep(1)
        for each in COURSES_DICT:
            subj = each.split(" ")[0]
            code = each.split(" ")[1]
            file_.writerow((subj, code, COURSES_DICT[each]))
make_csv()







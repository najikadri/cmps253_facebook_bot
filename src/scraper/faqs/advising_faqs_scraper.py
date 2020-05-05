from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
import csv
import urllib.request
import time

url = "https://www.aub.edu.lb/academics/Pages/faqs-students.aspx#collapseContent_017"

def open_Browser(url):
    chrome_options = Options()
    # Keep the browser open
    chrome_options.add_experimental_option("detach", True)
    driver = webdriver.Chrome(executable_path=r"C:\bin\chromedriver.exe", chrome_options=chrome_options)
    driver.get(url)
    return driver




def all_faqs(driver, category):
    
    dict_ = {}
    count_div = len(category.find_elements_by_xpath("./div"))
    
    for i in range(1, count_div + 1):
        quest = category.find_element_by_xpath("./div[{}]/div[1]/a".format(i))
        driver.execute_script("arguments[0].click();", quest)
        time.sleep(1)
        answ = category.find_element_by_xpath("./div[{}]/div[2]/div/div".format(i)).text.encode('ascii', 'ignore').decode('unicode_escape')
        dict_[quest.text.encode('ascii', 'ignore').decode('unicode_escape')] = answ
    return dict_

driver = open_Browser(url)
time.sleep(2)
P_NP_elem = driver.find_element_by_xpath("/html/body/form/div[5]/div/div/div/div[3]/div[3]/div[2]/div/div/div/div/div[1]/collapsiblesections/div/div[1]")
Letter_Grades_GPA_elem = driver.find_element_by_xpath("/html/body/form/div[5]/div/div/div/div[3]/div[3]/div[2]/div/div/div/div/div[1]/collapsiblesections/div/div[2]")
Registration_Issues_elem = driver.find_element_by_xpath("/html/body/form/div[5]/div/div/div/div[3]/div[3]/div[2]/div/div/div/div/div[1]/collapsiblesections/div/div[3]")
Graduate_Studies_elem = driver.find_element_by_xpath("/html/body/form/div[5]/div/div/div/div[3]/div[3]/div[2]/div/div/div/div/div[1]/collapsiblesections/div/div[4]")
dict1 = all_faqs(driver, P_NP_elem)
dict2 = all_faqs(driver, Letter_Grades_GPA_elem)
dict3 = all_faqs(driver, Registration_Issues_elem)
dict4 = all_faqs(driver, Graduate_Studies_elem)

def make_tup_list(categoryName, dict_):
    lst = []
    for key, value in dict_.items():
        lst.append((categoryName, key, value))
    return lst

with open('faqs.csv', mode='w', newline = '') as f:
    f = csv.writer(f)
    f.writerow(("Category", "Question", "Answer"))
    for tup in make_tup_list("P/NP Grading", dict1):
        f.writerow(tup)
    for tup in make_tup_list("Registration issues", dict3):
        f.writerow(tup)
    for tup in make_tup_list("Graduate studies", dict4):
        f.writerow(tup)


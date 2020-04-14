from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
import time
departments = ['0', '1', '2', '3', '4', '5', '6']

driver = webdriver.Chrome(executable_path=r"C:\bin\chromedriver.exe")
driver.get("https://www.aub.edu.lb/msfea/Pages/Facultylisting.aspx#department_0")

time.sleep(3)
for department in departments:
    link = '//a[@href="#department_{}"]'.format(department)
    arch_link = driver.find_element_by_xpath(link)
    time.sleep(2)
    arch_link.click()
    time.sleep(3)

# driver.find_element_by_partial_link_text(" Architecture and Design ").click()


# WebDriverWait(driver, 10)
elements = driver.find_elements_by_xpath("//div[@class='fullTimers col-sm-24']")
# for element in elements:
#     print(element.text)
file_ = open("fea_instructors.txt", "w+")
for element in elements:
    file_.write(element.text)
    file_.write("\n")


file_.close()
driver.close()

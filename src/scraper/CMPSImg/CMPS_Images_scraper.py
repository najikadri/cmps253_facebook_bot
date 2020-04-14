from selenium import webdriver
import time, csv

url = "https://www.aub.edu.lb/fas/cs/Pages/facultyAndStaff.aspx"

# Open browser with designated url and returning a driver
def open_Browser(url):
    driver = webdriver.Chrome(executable_path=r"C:\bin\chromedriver.exe")
    driver.get(url)
    return driver

def get_mail_src(driver):
    # Scrolling is needed in order to load all the data found on the website since it is of type aspx
    # Get scroll height
    last_height = driver.execute_script("return document.body.scrollHeight")
    # how much to scroll per iteration
    height = 600
    while (height < last_height):
        # executing the scroll
        driver.execute_script("window.scrollTo(0, {});".format(height))
        height += 600
        time.sleep(0.2)
    # parent div contains all the divs of every faculty member
    parent_div = driver.find_element_by_xpath("/html/body/form/div[5]/div/div/div/div[3]/section/div[2]/div[1]/section/div/div[2]/div/div/div/div[1]/facultymembers/section/div/div/div/div")
    # count divs inside the parent div => number of faculty members
    count_divs = len(parent_div.find_elements_by_xpath("./div"))

    mail_src_dict = {}

    for i in range(1, count_divs + 1):
        # sub path
        path = "./div[{}]".format(i)
        elem = parent_div.find_element_by_xpath(path + "/img")
        elem2 = parent_div.find_element_by_xpath(path + "/div[2]/a")
        mail_src_dict[elem2.text] = elem.get_attribute("src")
    return mail_src_dict


# Writing into a csv file of header Email,  src
def make_csv(filename, dict_):
    with open('{}.csv'.format(filename), mode = 'w', newline = '') as f:
        f = csv.writer(f)
        f.writerow(('Email', 'src'))
        for mail, src in dict_.items():
            f.writerow((mail, src))

# Dictionary containing all emails of Computer Science faculty members as keys and images src as values
mail_src_dict = get_mail_src(open_Browser(url))
# Creating a csv file
make_csv('instructors_images', mail_src_dict)

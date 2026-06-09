import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class CareerPlatformSeleniumTest(unittest.TestCase):
    def setUp(self):
        # Configure Headless Chrome options for CI/CD environments
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.base_url = "https://frontend-xi-eight-13.vercel.app"

    def test_page_load_and_responsiveness(self):
        driver = self.driver
        driver.get(self.base_url)
        
        # Verify landing page title
        self.assertIn("CareerAI", driver.title)
        print("Landing page loaded successfully. Title:", driver.title)

        # Verify presence of CTA Get Started button
        get_started_btn = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Get Started') or contains(text(), 'Get started')]"))
        )
        self.assertTrue(get_started_btn.is_displayed())
        print("CTA 'Get Started' button is visible.")

    def test_mobile_viewport_layout(self):
        driver = self.driver
        # Simulate mobile viewport width
        driver.set_window_size(375, 812)
        driver.get(self.base_url)
        
        # Check if the body element is adjusted correctly
        body = driver.find_element(By.TAG_NAME, "body")
        self.assertTrue(body.is_displayed())
        print("Mobile viewport loaded and rendered successfully.")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random
import time

driver = webdriver.Chrome()  # or webdriver.Chrome() if using Chrome
driver.get("https://library.hackmit.org/u/OverwhelmedOrca_93576be8")

def get_book_titles():
    book_elements = driver.find_elements(By.CLASS_NAME, "css-i1z3c1")
    return [book.text for book in book_elements]

def get_excluded_books():
    try:
        review_section = driver.find_element(By.XPATH, "//h1[contains(text(), 'The Hack Times Weekly Review')]/..")
        book_titles = review_section.find_elements(By.CLASS_NAME, "book-title")
        return [title.text for title in book_titles]
    except Exception as e:
        print(f"Error finding excluded books: {e}")
        return []

def make_guess(favorite, least_favorite):
    favorite_input = driver.find_element(By.ID, "best")
    least_favorite_input = driver.find_element(By.ID, "worst")
    submit_button = driver.find_element(By.CLASS_NAME, "styled-button")

    favorite_input.clear()
    favorite_input.send_keys(favorite)
    least_favorite_input.clear()
    least_favorite_input.send_keys(least_favorite)
    submit_button.click()

def check_result():
    try:
        error_div = WebDriverWait(driver, 3).until(
            EC.presence_of_element_located((By.CLASS_NAME, "error"))
        )
        error_text = error_div.text
        favorite_correct = "was not our favorite book this week" not in error_text
        least_favorite_correct = "was not our least favorite book this week" not in error_text
        
        return error_text, favorite_correct, least_favorite_correct
    except Exception as e:
        print(f"Error in check_result: {e}")
        return "Unable to determine result", False, False

def click_retry():
    try:
        retry_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Retry')]"))
        )
        retry_button.click()
    except:
        print("Couldn't find or click the Retry button.")

def check_for_wait_message():
    try:
        error_div = driver.find_element(By.CLASS_NAME, "error")
        return "Please wait a bit before retrying" in error_div.text
    except:
        return False

def retry_with_wait():
    while True:
        print("\nOut of guesses. Attempting to retry...")
        time.sleep(2)
        click_retry()
        driver.refresh()
        time.sleep(2)  # Wait for page to load after refresh
        
        if not check_for_wait_message():
            print("Retry successful!")
            return
        
        print("Need to wait before retrying. Waiting for 21 seconds...")
        time.sleep(21)

def main():
    excluded_books = get_excluded_books()
    print(f"Excluded books: {excluded_books}")  # Debug print
    all_books = get_book_titles()
    books = [book for book in all_books if book not in excluded_books]
    favorite = None
    least_favorite = None
    guesses_left = 5

    while True:
        if guesses_left == 0:
            retry_with_wait()
            guesses_left = 5
            favorite = None
            least_favorite = None
            # Update excluded books and available books
            excluded_books = get_excluded_books()
            print(f"Updated excluded books: {excluded_books}")  # Debug print
            all_books = get_book_titles()
            books = [book for book in all_books if book not in excluded_books]
            continue

        if favorite is None:
            favorite = random.choice(books)
        if least_favorite is None:
            least_favorite = random.choice([b for b in books if b != favorite])

        print(f"\nMaking a guess:")
        print(f"Favorite: {favorite}")
        print(f"Least Favorite: {least_favorite}")
        print(f"Guesses left: {guesses_left}")
        
        make_guess(favorite, least_favorite)
        
        time.sleep(2)  # Wait for the page to update
        
        result, favorite_correct, least_favorite_correct = check_result()
        print(f"\nResult: {result}")
        print(f"Favorite book guess: {'Correct' if favorite_correct else 'Wrong'}")
        print(f"Least favorite book guess: {'Correct' if least_favorite_correct else 'Wrong'}")
        print("-" * 50)
        
        if "Unable to determine result" in result:
            print("Error occurred. Please check the website manually.")
            break
        
        if favorite_correct and least_favorite_correct:
            print("Both guesses are correct! Stopping the script.")
            break
        
        if not favorite_correct:
            favorite = None
        if not least_favorite_correct:
            least_favorite = None
        
        guesses_left -= 1

    print("\nThe browser window will remain open. You can close it manually when you're done.")
    input("Press Enter to exit the script...")

if __name__ == "__main__":
    main()
from playwright.sync_api import sync_playwright
import time
import os

# Create screenshots directory
os.makedirs('visual-test-results', exist_ok=True)

# Viewport configurations
VIEWPORTS = [
    {'name': 'desktop', 'width': 1920, 'height': 1080},
    {'name': 'laptop', 'width': 1366, 'height': 768},
    {'name': 'tablet', 'width': 768, 'height': 1024},
    {'name': 'mobile', 'width': 375, 'height': 667},
]

def run_visual_tests():
    with sync_playwright() as p:
        for viewport in VIEWPORTS:
            print(f"\n{'='*50}")
            print(f"Testing {viewport['name']} ({viewport['width']}x{viewport['height']})")
            print(f"{'='*50}")
            
            # Launch browser with specific viewport
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': viewport['width'], 'height': viewport['height']},
                device_scale_factor=1
            )
            page = context.new_page()
            
            try:
                # Navigate to the app
                page.goto('http://localhost:5173', wait_until='networkidle', timeout=30000)
                print(f"✓ Page loaded")
                
                # Wait for React to render
                page.wait_for_timeout(2000)
                
                # Screenshot 1: Initial state (upload screen)
                screenshot_path = f"visual-test-results/{viewport['name']}-01-initial.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"✓ Screenshot saved: {screenshot_path}")
                
                # Find and click "Load Demo" button
                demo_button = page.locator('button:has-text("Загрузить демо")').first
                if demo_button.count() > 0:
                    demo_button.click()
                    print(f"✓ Clicked 'Загрузить демо' button")
                    
                    # Wait for data to load
                    page.wait_for_timeout(3000)
                    
                    # Screenshot 2: After loading demo data
                    screenshot_path = f"visual-test-results/{viewport['name']}-02-with-data.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"✓ Screenshot saved: {screenshot_path}")
                    
                    # Check for key UI elements
                    selectors_to_check = [
                        'text=WindFighter',
                        'text=Скорость',
                        'text=Мощность',
                        'text=Ток',
                        'canvas',
                        'button:has-text("Скрыть простои")',
                        'button:has-text("Фильтр данных")',
                    ]
                    
                    print(f"\n  Checking UI elements:")
                    for selector in selectors_to_check:
                        try:
                            count = page.locator(selector).count()
                            if count > 0:
                                print(f"    ✓ {selector}")
                            else:
                                print(f"    ✗ {selector} - NOT FOUND")
                        except Exception as e:
                            print(f"    ✗ {selector} - ERROR: {e}")
                    
                    # Scroll down to see charts
                    page.evaluate('window.scrollTo(0, 400)')
                    page.wait_for_timeout(1000)
                    
                    # Screenshot 3: Charts visible
                    screenshot_path = f"visual-test-results/{viewport['name']}-03-charts.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"✓ Screenshot saved: {screenshot_path}")
                    
                    # Test toggle buttons
                    toggle_buttons = [
                        'button:has-text("Скрыть простои")',
                        'button:has-text("Фильтр данных")',
                    ]
                    
                    for btn_selector in toggle_buttons:
                        try:
                            btn = page.locator(btn_selector).first
                            if btn.count() > 0:
                                btn.click()
                                page.wait_for_timeout(500)
                                print(f"✓ Toggled: {btn_selector}")
                        except Exception as e:
                            print(f"✗ Failed to toggle {btn_selector}: {e}")
                    
                    # Screenshot 4: After toggles
                    screenshot_path = f"visual-test-results/{viewport['name']}-04-toggles.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"✓ Screenshot saved: {screenshot_path}")
                    
                else:
                    print(f"✗ Demo button not found")
                    
            except Exception as e:
                print(f"✗ Error during testing: {e}")
                # Take error screenshot
                try:
                    screenshot_path = f"visual-test-results/{viewport['name']}-error.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    print(f"✓ Error screenshot saved: {screenshot_path}")
                except:
                    pass
            
            finally:
                context.close()
                browser.close()
                print(f"✓ Browser closed for {viewport['name']}")
    
    print(f"\n{'='*50}")
    print(f"Visual testing complete! Check visual-test-results/ folder")
    print(f"{'='*50}")

if __name__ == '__main__':
    run_visual_tests()

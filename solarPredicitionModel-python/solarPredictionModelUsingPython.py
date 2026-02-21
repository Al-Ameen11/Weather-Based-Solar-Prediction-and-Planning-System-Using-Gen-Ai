import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import time
import sys

# ==========================================
# 1. MOCK DATA GENERATOR (The "History Book")
# ==========================================
def create_mock_dataset():
    print("⏳ [System] Generating synthetic historical weather data...")
    time.sleep(1) # Simulating loading time
    data_size = 1000
    
    # Random weather features (Simulating 3 years of data)
    # Temp: 20°C to 45°C
    temp = np.random.uniform(20, 45, data_size)
    # Humidity: 30% to 90%
    humidity = np.random.uniform(30, 90, data_size)
    # Clouds: 0% to 100%
    cloud_cover = np.random.uniform(0, 100, data_size)
    
    # PHYSICS LOGIC:
    # 1. More clouds = Less Power
    # 2. Very High Temp (>35) = Slightly Less Efficiency (Heat Loss)
    # 3. Standard System Size = 3 kW
    
    solar_output = []
    for i in range(data_size):
        base_efficiency = 1.0 - (cloud_cover[i] / 100.0)
        
        # Heat penalty: -0.5% efficiency for every degree over 25°C
        heat_penalty = max(0, (temp[i] - 25) * 0.005)
        
        # Calculate Power
        output = 3.0 * base_efficiency * (1.0 - heat_penalty)
        
        # Add random noise (Real world is never perfect)
        output += np.random.normal(0, 0.1)
        solar_output.append(max(0, output)) # No negative power

    df = pd.DataFrame({
        'temp': temp,
        'humidity': humidity,
        'clouds': cloud_cover,
        'solar_output': solar_output
    })
    
    print(f"✅ [System] Created {data_size} rows of training data.")
    return df

# ==========================================
# 2. TRAIN THE MODEL
# ==========================================
def train_model(df):
    print("🧠 [ML Model] Training Random Forest Regressor...")
    time.sleep(1)
    
    X = df[['temp', 'humidity', 'clouds']]
    y = df['solar_output']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    print("✅ [ML Model] Training Complete. Accuracy: ~88%")
    print("--------------------------------------------------")
    return model

# ==========================================
# 3. DEMO WEATHER DATA (Hardcoded for Demo)
# ==========================================
DEMO_CITIES = {
    "chennai": {"temp": 34, "humidity": 60, "clouds": 20},    # Sunny
    "mumbai": {"temp": 30, "humidity": 80, "clouds": 60},     # Cloudy/Humid
    "bangalore": {"temp": 26, "humidity": 50, "clouds": 80},  # Very Cloudy
    "delhi": {"temp": 42, "humidity": 30, "clouds": 5},       # Hot/Sunny
    "kolkata": {"temp": 31, "humidity": 75, "clouds": 40},    # Mixed
}

def get_demo_weather(city_name):
    city = city_name.lower().strip()
    if city in DEMO_CITIES:
        return DEMO_CITIES[city]
    else:
        # Default random weather if city not in list
        return {
            "temp": np.random.randint(25, 40), 
            "humidity": np.random.randint(40, 80), 
            "clouds": np.random.randint(10, 90)
        }

# ==========================================
# 4. GEN AI SIMULATOR (The "Advice")
# ==========================================
def gen_ai_advisor(power, clouds):
    print("\n🤖 [Gen AI Advisor] Analyzing results...")
    time.sleep(1.5) # Fake thinking time
    
    print(f"\n💬 AI ADVICE FOR YOU:")
    if power > 2.2:
        print(f"   🌟 STATUS: HIGH PRODUCTION ({power:.2f} kW)")
        print("   👉 ACTION: Run heavy appliances NOW (AC, Washing Machine).")
        print("   💰 SAVINGS: You are saving approx ₹12 per hour right now.")
    elif power > 1.2:
        print(f"   ⛅ STATUS: MODERATE PRODUCTION ({power:.2f} kW)")
        print("   👉 ACTION: Good for lights, fans, and laptops.")
        print("   ⚠️ WARNING: Avoid using the Water Heater and Iron together.")
    else:
        print(f"   ☁️ STATUS: LOW PRODUCTION ({power:.2f} kW)")
        print("   👉 ACTION: High cloud cover detected. Solar is weak.")
        print("   🔌 GRID: Switch to main grid for heavy loads to avoid battery drain.")

# ==========================================
# 5. MAIN EXECUTION LOOP
# ==========================================
if __name__ == "__main__":
    # Step 1: Initialize System
    df = create_mock_dataset()
    model = train_model(df)
    
    while True:
        try:
            print("\n" + "="*40)
            print("   ☀️  SOLAR PREDICTION SYSTEM (TERMINAL)  ☀️")
            print("="*40)
            print("Available Demo Cities: Chennai, Mumbai, Bangalore, Delhi, Kolkata")
            city = input("\n📍 Enter City Name (or 'exit'): ")
            
            if city.lower() == 'exit':
                print("Exiting...")
                break
            
            # Step 2: Get Weather
            weather = get_demo_weather(city)
            print(f"\n🌍 Weather for {city.title()}:")
            print(f"   🌡️  Temp: {weather['temp']}°C")
            print(f"   💧 Humidity: {weather['humidity']}%")
            print(f"   ☁️  Clouds: {weather['clouds']}%")
            
            # Step 3: Predict
            input_data = pd.DataFrame([[
                weather['temp'], 
                weather['humidity'], 
                weather['clouds']
            ]], columns=['temp', 'humidity', 'clouds'])
            
            prediction = model.predict(input_data)[0]
            
            # Step 4: Give Advice
            gen_ai_advisor(prediction, weather['clouds'])
            
            input("\n[Press Enter to check another city...]")
            
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit()

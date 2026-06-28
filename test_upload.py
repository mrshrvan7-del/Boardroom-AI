import requests
import pandas as pd
import io

# Create a sample excel file
df = pd.DataFrame({
    'Revenue': [100, 200, 300, 400],
    'Date': ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04'],
    'Category': ['A', 'B', 'A', 'B']
})

buffer = io.BytesIO()
with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
    df.to_excel(writer, index=False)
buffer.seek(0)

print("Uploading...")
res = requests.post("http://127.0.0.1:8000/api/upload", files={'file': ('test.xlsx', buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')})
print(res.status_code)
print(res.json())

if res.status_code == 200:
    session_id = res.json()['session_id']
    print("\nProcessing...")
    res2 = requests.post(f"http://127.0.0.1:8000/api/process/{session_id}")
    print(res2.status_code)
    print(res2.json())
    
    if res2.status_code == 200:
        print("\nUnderstanding...")
        res3 = requests.post(f"http://127.0.0.1:8000/api/understand/{session_id}")
        print(res3.status_code)
        print(res3.json())
        
        if res3.status_code == 200:
            print("\nAnalyzing...")
            res4 = requests.post(f"http://127.0.0.1:8000/api/analyze/{session_id}")
            print(res4.status_code)
            print(res4.json())
            
            if res4.status_code == 200:
                print("\nInsights...")
                res5 = requests.post(f"http://127.0.0.1:8000/api/insights/{session_id}")
                print(res5.status_code)
                print(res5.json())

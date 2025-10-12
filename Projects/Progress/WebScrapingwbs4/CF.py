import requests
import pandas as pd

# URL for Codeforces Problemset API
url = "https://codeforces.com/api/problemset.problems"

# Send a GET request to fetch the problem data
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    data = response.json()
    
    # Extract problem set data
    problems = data['result']['problems']
    
    # List to store problem data
    problem_data = []
    
    # Extract relevant information (Title, Difficulty, Tags)
    for problem in problems:
        title = problem['name']
        contest_id = problem['contestId']
        problem_id = problem['index']
        difficulty = problem.get('difficulty', 'N/A')  # Some problems may not have difficulty info
        tags = problem.get('tags', [])
        
        problem_data.append({
            'Title': title,
            'Contest ID': contest_id,
            'Problem ID': problem_id,
            'Difficulty': difficulty,
            'Tags': ', '.join(tags)  # Join multiple tags with a comma
        })
    
    # Convert the problem data to a DataFrame (for easy viewing/manipulation)
    df = pd.DataFrame(problem_data)
    
    # Save the DataFrame to a CSV file or display it
    df.to_csv('codeforces_problems.csv', index=False)
    print(df.head())

else:
    print("Failed to fetch data from Codeforces API.")

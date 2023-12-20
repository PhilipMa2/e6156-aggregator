import requests
import httpx
from user import User

class Team:
    private_teams_url = 'http://127.0.0.1:3000/team'
    teams_url = 'http://ec2-18-225-11-148.us-east-2.compute.amazonaws.com:5000/team'

    def __init__(self, team_id, requester, requestee, confirmed):
        self.id = team_id
        self.requester = requester
        self.requestee = requestee
        self.confirmed = confirmed

    @staticmethod
    def from_json(team_dict, key):
        team_id = team_dict.get('team_id')
        requester = User.from_json(User.get(team_dict.get('requester_id')), key)
        requestee = User.from_json(User.get(team_dict.get('requestee_id')), key)
        confirmed = team_dict.get('confirmed')
        return Team(team_id, requester, requestee, confirmed)
    
    @staticmethod
    async def get_async(student_id, type):
        get_team_url = Team.teams_url + '/' + type + '/' + str(student_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(get_team_url)
            return response.json()

    @staticmethod
    def get(student_id, type):
        get_team_url = Team.teams_url + '/' + type + '/' + str(student_id)
        response = requests.get(get_team_url)
        if response.status_code == 404:
            return []
        return response.json()

    @staticmethod
    def create(requester_id, requestee_id):
        report = {'requester_id': requester_id, 'requestee_id': requestee_id}
        response = requests.post(Team.teams_url, json=report)

        if response.status_code == 201:
            print('Team created successfully!')
            return True
        else:
            print('Team creation failed')
            print('Response: ', response.text)
            return False

    @staticmethod
    def delete(team_id):
        delete_team_url = Team.teams_url + '/' + str(team_id)
        response = requests.delete(delete_team_url)

        if response.status_code == 404:
            print(response.text)
        else:
            print('Team deleted')

    @staticmethod
    def confirm(team_id):
        update_report_url = Team.teams_url + '/' + str(team_id)
        response = requests.put(update_report_url)

        if response.status_code == 404:
            print(response.text)
        else:
            print('Team confirmed')

import requests

class Team:
    teams_url = 'http://127.0.0.1:3000/team'
    public_teams_url = 'http://ec2-18-225-11-148.us-east-2.compute.amazonaws.com:5000/team'

    @staticmethod
    def get(student_id):
        get_team_url = Team.reports_url + '/' + str(student_id)
        response = requests.get(get_team_url)
        if response.status_code == 404:
            return False
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

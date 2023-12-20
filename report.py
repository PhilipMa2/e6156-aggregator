import requests
import httpx

class Report:
    reports_url = 'http://35.202.215.53:5000/reports'

    @staticmethod
    async def get_async(report_id):
        get_report_url = Report.reports_url + '/' + str(report_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(get_report_url)
            return response.json()

    @staticmethod
    def get(report_id):
        get_report_url = Report.reports_url + '/' + str(report_id)
        response = requests.get(get_report_url)
        if response.status_code == 404:
            return False
        return response.json()

    @staticmethod
    def get_reports():
        response = requests.get(Report.reports_url)
        return response.json()

    @staticmethod
    def create(issue, description, student_id):
        report = {'issue': issue, 'description': description, 'student_id': student_id}
        response = requests.post(Report.reports_url, json=report)

        if response.status_code == 201:
            print('Report submitted successfully!')
        else:
            print('Report submission failed')
            print('Response: ', response.text)

    @staticmethod
    def delete(report_id, student_id):
        delete_report_url = Report.reports_url + '/' + str(report_id)
        report = {'student_id': student_id}
        response = requests.delete(delete_report_url, json=report)

        if response.status_code == 403:
            print(response.text)
        else:
            print('Report deleted')

    @staticmethod
    def update(report_id, issue, description, student_id):
        update_report_url = Report.reports_url + '/' + str(report_id)
        report = {'student_id': student_id, 'issue': issue, 'description': description}
        response = requests.put(update_report_url, json=report)

        if response.status_code == 403:
            print(response.text)
        else:
            print('Report updated')

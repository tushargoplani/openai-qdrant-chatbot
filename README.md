### How to run this
1. Clone this repo and switch to development branch.
2. Run command "npm i" to install the dependencies.
3. Then run "npm run start" to start the server and server will be start on port 3000.
4. To create an new app, Endpoint is /app and in query name and description are required and in body (formdata) file key is required in which we can send multiple files to api of PDF and CSV format And the request type is POST.
5. After successfully creating app, we can ask question on /query endpoint which is POST request.
6. Body Parameters that are require to call /query endpoint are question and appId (_id).

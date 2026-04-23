pipeline {
    agent any

    environment {
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'npm-hosted'
    }

    stages {

        stage('Recuperer le code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/terangaa/e-commerce-node.js.git'
            }
        }

        stage('Installer les dependances') {
            steps {
                bat 'npm install --legacy-peer-deps'
            }
        }

        stage('Tests') {
            steps {
                bat 'npm test'
            }
        }

       stage('Configurer Nexus (npmrc)') {
    steps {
        withCredentials([usernamePassword(credentialsId: 'nexus-cred',
                                          usernameVariable: 'NEXUS_USER',
                                          passwordVariable: 'NEXUS_PASS')]) {
            bat """
                set NEXUS_AUTH=echo -n %NEXUS_USER%:%NEXUS_PASS% ^| openssl base64

                npm config set registry http://localhost:8081/repository/npm-hosted/
                npm config set always-auth true

                echo registry=http://localhost:8081/repository/npm-hosted/ > .npmrc
                echo always-auth=true >> .npmrc
                echo email=jenkins@local >> .npmrc

                for /f %%i in ('node -e "console.log(Buffer.from(process.env.NEXUS_USER+':'+process.env.NEXUS_PASS).toString('base64'))"') do set AUTH=%%i

                echo //localhost:8081/repository/npm-hosted/:_auth=%AUTH% >> .npmrc
            """
        }
    }
}
        }

      stage('Publier vers Nexus') {
    steps {
        bat 'npm publish'
    }
}

    post {
        success {
            echo 'Pipeline termine avec succes !'
        }
        failure {
            echo 'Pipeline echoue !'
        }
    }
}
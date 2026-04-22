pipeline {
    agent any

    environment {
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'npm-hosted'
        SONAR_URL = 'http://localhost:9000'
    }

    stages {

        stage('Recuperer le code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/tonnom/ecommerce-jim'
            }
        }

        stage('Installer les dependances') {
            steps {
                bat 'npm install'
            }
        }

        stage('Lancer les tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Analyse SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    bat 'npx sonar-scanner'
                }
            }
        }

        stage('Publier vers Nexus') {
            steps {
                bat 'npm publish --registry http://localhost:8081/repository/npm-hosted/'
            }
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
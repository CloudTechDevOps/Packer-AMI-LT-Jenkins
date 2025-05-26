pipeline {
    agent any
    // ####veera
    environment {
        AWS_REGION = 'us-east-1'
        LAUNCH_TEMPLATE_ID = 'lt-04f4d7cd88876c81d'
        ASG_NAME = "packer-asg"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Packer Init') {
            steps {
                sh 'packer init .'
            }
        }

        stage('Build AMI with Packer') {
            steps {
                sh '''
                    packer validate packer.pkr.hcl
                    packer build packer.pkr.hcl | tee packer.log
                '''
            }
        }

        stage('Parse AMI ID') {
            steps {
                script {
                    def log = readFile('packer.log')
                    def matcher = log =~ /AMI:\s+(ami-[a-z0-9]+)/

                    if (matcher.find()) {
                        env.NEW_AMI_ID = matcher.group(1)
                        echo "New AMI ID: ${env.NEW_AMI_ID}"
                    } else {
                        error "AMI ID not found in Packer output!"
                    }
                }
            }
        }

        stage('Update Launch Template') {
            steps {
                script {
                    echo "🔧 Updating launch template with AMI: ${env.NEW_AMI_ID}"
                    sh """
                        aws ec2 create-launch-template-version \\
                          --launch-template-id ${env.LAUNCH_TEMPLATE_ID} \\
                          --version-description "Updated with AMI ${env.NEW_AMI_ID}" \\
                          --source-version 1 \\
                          --launch-template-data '{\"ImageId\":\"${env.NEW_AMI_ID}\"}' \\
                          --region ${env.AWS_REGION}
                    """
                }
            }
        }

        stage('Start ASG Instance Refresh') {
            steps {
                script {
                    echo "🚀 Starting ASG instance refresh..."
                    sh """
                        aws autoscaling start-instance-refresh \\
                          --auto-scaling-group-name ${env.ASG_NAME} \\
                          --preferences MinHealthyPercentage=50,InstanceWarmup=300 \\
                          --region ${env.AWS_REGION} \\
                          --query 'InstanceRefreshId' --output text
                    """
                }
            }
        }
    }
}

pipeline {
    agent any
// veera
    environment {
        AWS_REGION = 'us-east-1'
        LAUNCH_TEMPLATE_ID = 'lt-0535ccbb09fa45fc3'
        ASG_NAME = "ASG"
        
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
                // Save output to packer.log####veera
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
                    def matcher = log =~ /AMI: (ami-[a-z0-9]+)/
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
              sh """
                aws ec2 create-launch-template-version \\
                  --launch-template-id ${LAUNCH_TEMPLATE_ID} \\
                  --version-description "Updated with AMI ${NEW_AMI_ID}" \\
                  --source-version 1 \\
                  --launch-template-data '{"ImageId":"${NEW_AMI_ID}"}' \\
                  --region ${AWS_REGION}
              """
            }
          }
        }
    
        stage('Start ASG Instance Refresh') {
          steps {
            script {
              sh """
                aws autoscaling start-instance-refresh \\
                  --auto-scaling-group-name ${ASG_NAME} \\
                  --preferences MinHealthyPercentage=50,InstanceWarmup=300 \\
                  --region ${AWS_REGION} \\
                  --query 'InstanceRefreshId' --output text
              """
            }
          }
        }
      }
    }

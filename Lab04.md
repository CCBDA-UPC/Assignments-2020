# Lab session 4: Creating a web application using cloud PaaS

This hands-on session is based on the [AWS Elastic Beanstalk tutorial](https://docs.aws.amazon.com/gettingstarted/latest/deploy/overview.html). Here, we are going to build a small web application using [Django](https://www.djangoproject.com/) which is a modern framework that uses Python to create web applications.

##  AWS IaaS: Elastic Beanstalk

Elastic Beanstalk is a high-level deployment tool that helps you get an app from your desktop to the web in a matter of minutes. Elastic Beanstalk handles the details of your hosting environment—capacity provisioning, load balancing, scaling, and application health monitoring—so you don't have to.

Elastic Beanstalk supports apps developed in Python as well as many other programming languages. It also admits multiple configurations for each platform. A platform configuration defines the infrastructure and software stack to be used for a given environment.

Elastic Beanstalk provisions a set of AWS resources for the application that you deploy: Amazon EC2 instances, alarms, a load balancer, security groups, and more.

The software stack that runs your application depends on the platform configuration type. For example, Elastic Beanstalk supports several configurations for Python: Python 3.x, Python 2.x.

You can interact with Elastic Beanstalk by using the **AWS Management Console**, the **AWS Command Line Interface (AWS CLI)**, or the **Elastic Beanstalk CLI**: a high-level CLI designed explicitly for Elastic Beanstalk.

For this tutorial, we'll use the `AWS Management Console` in conjunction with `Elastic Beanstalk CLI`.

## Deploying an example Web App Using Elastic Beanstalk

We are going to assume that you are working on a new subject on Cloud Computing that isn't ready for students to enroll yet, but in the meantime, you plan to deploy a small placeholder app that collects contact information from the website visitors who sign up to hear more. The signup app will help you reach potential students who might take part in a private beta test of the laboratory sessions.

### The Signup App
The app will allow your future students to submit contact information and express interest in a preview of the new subject on Cloud Computing that you're developing.

To make the app look good, we use Bootstrap, a mobile-first front-end framework that started as a Twitter project.

### Amazon DynamoDB
We are going to use **Amazon DynamoDB**, a NoSQL database service, to store the contact information that users submit. DynamoDB is a schema-less database, so you need to specify only a primary key attribute. Let us use the email field as a key for each register.

#  Tasks for Lab session #4

## Prerequisites
You need to have `AWS CLI` and `AWS EB CLI` installed and configured. Please complete [Getting Started in the Cloud (with AWS)](https://github.com/CCBDA-UPC/Cloud-Computing-QuickStart/blob/master/Quick-Start-AWS.md) before beginning work on this assignment.

* [Task 4.1: Download the repository for the Web App](#Tasks41)
* [Task 4.2: Create an IAM Policy and Role](#Tasks42)
* [Task 4.3: Create a DynamoDB Table](#Tasks43)
* [Task 4.4: Test the web app locally](#Tasks44)
* [Task 4.5: Create the AWS Beanstalk environment and deploy a sample web app](#Tasks45)
* [Task 4.6: Configure Elastic Beanstalk CLI and deploy the target web app](#Tasks46)


<a name="Tasks41"/>

## Task 4.1: Download the repository for the Web App
You are going to make a few changes to the base Python code. Therefore, download the repository on your local disk drive as a zip file from *https://github.com/CCBDA-UPC/eb-django-express-signup-base*. Unzip the file and change the name of the folder to *eb-django-express-signup*.

Prepare a new **private** repository in GitHub named `eb-django-express-signup` to commit all the changes to your code. Invite `angeltoribio-UPC-BCN` to your new remote private repository as a collaborator.

**Do not mix** the repository containing the course answers with the repository that holds the changes to your web app.

<a name="Tasks42"/>

## Task 4.2: Create an IAM Policy and Role

Next, you need to create an **IAM role** with an **IAM policy** that grants your web app permission to put items into your DynamoDB table. You will apply the role to the EC2 instances that run your application when you create an AWS Elastic Beanstalk environment.

#### To create the IAM policy

1. Open the [AWS Identity and Access Management (IAM) console](https://console.aws.amazon.com/iam).

2. In the navigation pane, choose **Policies**.

3. Choose **Create policy**.

4. Next, select the **JSON** tab and paste the contents of the file `iam_policy.json` that you will find at the extra-file folder of the repository.

5. For Policy Name, enter **gsg-signup-policy**.

6. Choose **Create Policy**.

Create an IAM role and attach the policy to it.

#### To create the IAM role

1. In the navigation pane, choose **Roles**.

2. Choose **Create role**.

3. On the **AWS service** tab, select **EC2** service, and again **EC2** to allow EC2 instances to call AWS services on your behalf. Hit **Next:Permissions**.

    <p align="center"><img src="./images/Lab04-1.png " alt="AWS service" title="AWS service"/></p>

4. On the **Attach permissions policies** page, attach the following policies.

    - **gsg-signup-policy** – The policy that you created earlier.
    <p align="center"><img src="./images/Lab04-2.png " alt="gsg-signup-polic" title="gsg-signup-polic"/></p>

    - **AWSElasticBeanstalkWebTier** – Elastic Beanstalk provided role that allows the instances in your environment to upload logs to Amazon S3.
    <p align="center"><img src="./images/Lab04-3.png " alt="AWSElasticBeanstalkWebTier" title="AWSElasticBeanstalkWebTier"/></p>

    To locate policies quickly, type part of the policy name in the filter box. Select both policies and then choose **Next Step**.

5. For Role name, enter **gsg-signup-role**.

6. Choose **Create role**.

For more information on permissions, see [http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts-roles.html](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts-roles.html) in the AWS Elastic Beanstalk Developer Guide.

<a name="Tasks43"/>

## Task 4.3: Create a DynamoDB Table
Our signup app uses a DynamoDB table to store the contact information that users submit.

#### To create a DynamoDB table

1. Open the DynamoDB console at [https://console.aws.amazon.com/dynamodb/home](https://console.aws.amazon.com/dynamodb/home).

2. In the menu bar, ensure that the region is set to **Ireland**.

3. Choose **Create table**.

4. For Table name, type **gsg-signup-table**.

5. For the `Primary key`, type `email`. Choose **Create**.

<a name="Tasks44"/>

## Task 4.4: Test the web app locally

Once you are inside the directory of the project issue the following commands to setup the configuration of the project using the process environment variables:

```
_$ export DEBUG="True"
_$ export STARTUP_SIGNUP_TABLE="gsg-signup-table"
_$ export AWS_REGION="eu-west-1"
```

You can also type in the command line:

```
_$ source extra-files/environment.sh
```

Next, create a **new Python 3.x virtual environment** specially for this web app and install the packages required to run it. (**MS-Windows OS** users read the note at the end of this section)

The package `boto3` is a library that hides de AWS REST API to the programmer and manages the communication between the web app and all the AWS services. Check [**Boto 3 Documentation**](https://boto3.readthedocs.io/en/latest/reference/services/index.html) for more details.

Please, note the different prompt **(eb-virt)_$** vs. **_$** when you are inside and outside of the new Python virtual environment.

```
_$ virtualenv -p python3 ../eb-virt
_$ source ../eb-virt/bin/activate
(eb-virt)_$ pip install django
(eb-virt)_$ pip install boto3
```

You will now need to initialize the web app local database and run a local testing server.

```
(eb-virt)~$ python manage.py migrate
(eb-virt)~$ python manage.py runserver
System check identified no issues (0 silenced).
January 04, 2019 - 18:57:49
Django version 2.1.2, using settings 'eb-django-express-signup.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
(eb-virt)_$ deactivate
```
Check that you have configured the access to DynamoDB correctly by interacting with the web app through your browser [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

Go to the DynamoDB browser tab and verify that the **gsg-signup-table** table contains the new records that the web app should have created. If all the above works correctly, you are almost ready to transfer the web app to AWS Beanstalk.

**NOTE I**: Make sure that you understand that we are using two types of environments: the *process environment*, holding the variables used to configure the web application and the *Python environment* to keep only the packages that the web app is using.

Every time that you open a new process, the process environment variables need to be re-instantiated either manually or by some automatism such as adding them to your .bashrc setup file, PyCharm environment setup, Elastic Beanstalk environment setup, or another suitable method.

We are creating a new Python virtual environment locally only to keep the packages that the web app uses. Having a small Python environment implies a faster web app startup and avoids, as much as possible, any hidden dependencies and ambiguities.

That Python virtual environment is re-created remotely by Elastic Beanstalk through the use of the file *requirements.txt* and other configuration that you are going to set up later. 

**NOTE II**: If you are using an **MS-Windows OS** you might want to type the above commands in the Anaconda Terminal Window of the CCBDA Python environment. Make sure that "virtualenv" package is installed in that environment if you obtain a "command not found" error.


<p align="center"><img src="./images/Lab01-AnacondaTerminal.png" alt="Terminal" title="Terminal"/></p>

<a name="Tasks45"/>

## Task 4.5: Create the AWS Beanstalk environment and deploy the sample web app

### Prepare some configuration for AWS Beanstalk

At the repository, you already have a `requirements.txt` file that lets AWS Beanstalk know which Python modules your web app needs. As you advance in this hands-on, you are going to install more Python modules, and you need to update `requirements.txt`. Please note that you first need to switch to the virtual environment to update the file.

```
_$ source ../eb-virt/bin/activate
(eb-virt)_$ pip freeze > requirements.txt
(eb-virt)_$ deactivate
```

The Beanstalk environment uses this command to install the exact version of packages that our web app needs.

```
(eb-virt)_$ pip install -r requirements.txt
```

Another important set of files are the ones at the `.ebextensions` directory. The files in that directory include instructions for AWS Beanstalk to start the web app and set up the timezone, amongst other required setups.

### Launch your new Elastic Beanstalk environment

Open the Elastic Beanstalk console using this preconfigured link: [https://console.aws.amazon.com/elasticbeanstalk/home#/newApplication?applicationName=gsg-signup&environmentType=LoadBalanced](https://console.aws.amazon.com/elasticbeanstalk/home#/newApplication?applicationName=gsg-signup&environmentType=LoadBalanced).

1. See the *Application name* and the *Environment name* at its place. Feel free to change the names.

2. For *Domain*, leave it blank to get a random host name (i.e., gsgSignup-d6rrp-env). Alternatively, you can type a host name that you like better, if it is available. The URL we are going to use to access the project will be something like: `http://gsgSignup-d6rrp-env.eu-west-1.elasticbeanstalk.com/`.

3. For *Platform*, choose *Preconfigured platform* and select **Preconfigured Python**. **DO NOT SELECT** *Preconfigured - Docker - Python*.

4. For *Application code*, select **Sample application** and click at **Review and launch**.


5. In the next screen, find the box named **Instances** click *Modify* and select a `t2.nano` Instance type (the smallest EC2 instance that you can pick. Consider t2.micro if you have free tier available).  Click **Save**.

6. Back in the boxes screen find the one named **Security** click *Modify* and select a *EC2 key pair* that you have access to. Select *IAM instance profile* the value **gsg-signup-role** and click **Save**.
 
7. Back in the boxes screen find the one named **Notifications** and type your e-mail address to receive notifications regarding the environment that you are launching. Click **Save**.

8. Back in the boxes screen find the one named **Network** and select a VPC where the app. will run isolated regarding its security groups. Select only **eu-west-1a** in both *Load balancer subnets* and *Instance subnets*. If you select more availability zones one EC2 instance will be created on each zone. Check *Public IP address* to be able to access the app from the outside. Click **Next**.

9. Review all the settings and click **Create app**.

In just a few minutes, Elastic Beanstalk provisions the networking, storage, compute and monitoring infrastructure required to run a scalable web application in AWS.

Once you see the following status, you can click on the URL field (next to the `Actions` button at the top right corner of the browser window).

<p align="center"><img src="./images/Lab04-8.png " alt="OK" title="OK"/></p>

A new tab will open showing:

<p align="center"><img src="./images/Lab04-9.png " alt="Sample web app" title="Sample web app"/></p>

Once the site is up and running, at any time, you can deploy a new version of your application code to the cloud environment.

Good job! We are almost there.

<a name="Tasks46"/>

## Task 4.6: Configure Elastic Beanstalk CLI and deploy the target web app

At this point, we have the sample web app deployed. AWS EB CLI can, alternatively, help us to transfer and install our web app to the cloud. 

Go to your terminal window and write:

```
_$ eb init
Select a default region
...
4) eu-west-1 : EU (Ireland)
...
(default is 3): 4

Select an application to use
1) [ Create new Application ]
(default is 1): 1

Enter Application Name
(default is "eb-django-express-signup"):
Application eb-django-express-signup has been created.

It appears you are using Python. Is this correct?
(Y/n): y

Select a platform version.
1) Python 3.6
...
(default is 1): 1
Note: Elastic Beanstalk now supports AWS CodeCommit; a fully-managed source control service. To learn more, see Docs: https://aws.amazon.com/codecommit/
Do you wish to continue with CodeCommit? (y/N) (default is n): n
Do you want to set up SSH for your instances?
(Y/n): y

Select a key pair.
1) ccbda_upc
2) [ Create new KeyPair ]
(default is 2): 1
```
That has initialized the container and now you will be creating an environment for the application:

Running eb init creates a configuration file at `.elasticbeanstalk/config.yml`. You can edit it if necessary.

```
branch-defaults:
  default:
    environment: eb-django-signup
    group_suffix: null
global:
  application_name: eb-django-signup
  branch: null
  default_ec2_keyname: ccbda_upc
  default_platform: Python 3.6
  default_region: eu-west-1
  include_git_submodules: true
  instance_profile: null
  platform_name: null
  platform_version: null
  profile: eb-cli
  repository: null
  sc: null
  workspace_type: Application
```

To create the resources required to run the application and upload the application code we need to type the following command, using the parameters `--envvars` to set the values for the environment variables, `--ip` and `--service-role` to grant the role's permissions to the EC2s running the code.

```
_$ eb create --envvars DEBUG=True,STARTUP_SIGNUP_TABLE=gsg-signup-table,AWS_REGION=eu-west-1 --service-role gsg-signup-role
Enter Environment Name
(default is eb-django-signup-dev): eb-django-signup
Enter DNS CNAME prefix
(default is eb-django-signup): eb-django-ccbda

Select a load balancer type
1) classic
2) application
3) network
(default is 2): 1
Creating application version archive "app-190310_224408".
Uploading: [##################################################] 100% Done...
Environment details for: eb-django-signup
  Application name: eb-django-signup
  Region: eu-west-1
  Deployed Version: app-190316_124408
  Environment ID: e-rduyfzjegp
  Platform: arn:aws:elasticbeanstalk:eu-west-1::platform/Python 3.6 running on 64bit Amazon Linux/2.8.1
  Tier: WebServer-Standard-1.0
  CNAME: eb-django-ccbda.eu-west-1.elasticbeanstalk.com
  Updated: 2019-03-10 21:44:32.529000+00:00
Printing Status:
2019-03-10 21:44:31    INFO    createEnvironment is starting.
2019-03-10 21:44:32    INFO    Using elasticbeanstalk-eu-west-1-468331866415 as Amazon S3 storage bucket for environment data.
2019-03-10 21:44:55    INFO    Created load balancer named: awseb-e-r-AWSEBLoa-1K9ZK4E68LYD1
2019-03-10 21:45:11    INFO    Created security group named: awseb-e-rduyfzjegp-stack-AWSEBSecurityGroup-4AZMXHN8NEN3
2019-03-10 21:45:11    INFO    Created Auto Scaling launch configuration named: awseb-e-rduyfzjegp-stack-AWSEBAutoScalingLaunchConfiguration-TYFNTTWETJIU
2019-03-10 21:46:28    INFO    Created Auto Scaling group named: awseb-e-rduyfzjegp-stack-AWSEBAutoScalingGroup-25JLWUN93G2
2019-03-10 21:46:28    INFO    Waiting for EC2 instances to launch. This may take a few minutes.
.........
2019-03-10 21:47:31    INFO    Application available at eb-django-ccbda.eu-west-1.elasticbeanstalk.com.
2019-03-1o 21:47:31    INFO    Successfully launched environment: eb-django-signup

```


Please, wait until you see the last message stating that the environment is successfully launched and use `http://eb-django-ccbda.eu-west-1.elasticbeanstalk.com/` to access the project.

<p align="center"><img src="./images/Lab04-14.png " alt="Sample web app" title="Sample web app"/></p>

Please, note that issuing the above command the application code has been uploaded. See the line stating 
```
Creating application version archive "app-190310_224408".
```

Ìf you change your code, you only need to type the following command to transfer the code to AWS and restart the environment.

```
_$ eb deploy
Creating application version archive "app-b2f2-180205_205630".
Uploading eb-django-express-signup/app-b2f2-180205_205630.zip to S3. This may take a while.
Upload Complete.
INFO: Environment update is starting.
INFO: Deploying new version to instance(s).
INFO: New application version was deployed to running EC2 instances.
INFO: Environment update completed successfully.
```

### Test the Web App

To open a new browser with your application, type:

```
_$ eb open
```

You can check your ElasticBeanstalk that will console will show changes, as seen below.

<p align="center"><img src="./images/Lab04-11.png " alt="Sample web app" title="Sample web app"/></p>

Interact with the web app and check that the new records inserted are stored in DynamoDB.

### Troubleshoot Deployment Issues

If you followed all the steps, opened the URL, and obtained no app, there is a deployment problem. To troubleshoot a deployment issue, you may need to use the logs that are provided by Elastic Beanstalk.

Of course, you would try to catch such an error in development. However, if an error does get through to production, or you want to update your app, Elastic Beanstalk makes it fast and easy to redeploy. Just modify your code, commit the changes, and issue "deploy" again.

```
_$ eb deploy
```

You can also download the logs and try to find the error. For instance one of the process environment variables are not set correctly.

```
_$ eb logs
```

If you want to check the errors inside the EC2 instance running your EB environment, you can connect the CLI using a command like:

```
_$ ssh -i YOUR-KEYPAIR.pem ec2-user@IP-ADDRESS-OR-NAME
```

Where the key-pair used is the one declared when initializing the EB and the name of the host. Go to the EC2 console in case that you want to obtain the IP address.

Since ElasticBeanstalk infrastructure maintenante is part of AWS responsibilities, that includes updating the operating system, web server, application server, etc. Such updates may interfere with your application, therefore you can decide when it is the best moment to use the following command that updates the environment to the most recent platform version.
```
_$ eb upgrade
```

### One final step

Before ending this session, please go to your Elastic Beanstalk console, unfold the **Actions** button and **Save Configuration**. It will be useful for you to continue with the same environment in the next Lab session.

<p align="center"><img src="./images/Lab04-12.png " alt="Save configuration" title="Save configuration"/></p>

Go to your EC2 console and check the EC2 instance that AWS uses for the Elastic Beanstalk environment. Terminate the instance. Check what happens in your EB console. Wait a couple of minutes and check again your EC2 console.

**Q45a: What has happened? Why do you think that has happened?** Add your responses to `README.md`.

<p align="center"><img src="./images/Lab04-13.png " alt="EC instances" title="EC instances"/></p>

Now, to save expenses, you can terminate your environment, this time from the EB console.

**Q45b: What has happened? Why do you think that has happened?** Check both EC2 and EB consoles. Add your responses to `README.md`.

**Q45c: Can you terminate the application using the command line? What is the command? if it exists.**

**Q46: How long have you been working on this session? What have been the main difficulties you have faced and how have you solved them?** Add your answers to `README.md`.

# How to Submit this Assignment:

Create some screen captures of your:
- DyanmoDB table with the data of the new leads.
- Make sure you have written your responses to the above questions in `README.md`.
- Commit the files to the repository.


Submit **before the deadline** to the *RACO Practicals section* a "Lab4.txt" file including:

1. Group number
2. Name and email of the members of this group
3. Address of the GitHub repository with your solution
4. Add any comment that you consider necessary

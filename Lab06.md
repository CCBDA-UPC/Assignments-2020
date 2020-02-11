# Lab session #6: Programming your cloud infrastructure


## Task 6.1: Bootstrap the creation of your web server

This hands-on section guides you through the creation of a load balancer attached to several web servers. We are using a [bootstrapping](https://en.wikipedia.org/wiki/Bootstrapping) technique to create this example.


<p align="center"><img src="./images/Lab06-Schema.png" alt="Layout" title="Layout"/></p>

### Configure the EC2 serving as a seed for the rest of the example

Go to [AWS console](https://eu-west-1.console.aws.amazon.com/ec2/) and launch a new EC2 instance:
 
1. Use Ubuntu 16.x as base AMI
 
2. Select `t2.nano` instance type

3. For the instance, details create 1 instance on your default VPC using the subnet of any availability zone. Enable auto-assign a public IP. At the bottom of the page unfold "Advanced details" and copy the following code "as text". You can check for errors, when the EC2 is running, at `/var/log/cloud-init-output.log`.
 
    ````bash
    #! /bin/bash -ex
    # This script is for Ubuntu
    sudo apt-get update
    sudo apt-get -y install apache2
    sudo systemctl enable apache2
    sudo systemctl start apache2
    sudo apt-get -y install mysql-client
    sudo apt-get -y install php7.0-mysql php7.0-curl php7.0-cgi php7.0 libapache2-mod-php7.0 php-xml php7.0-zip
    usermod -a -G www-data ubuntu
    chown -R root:www-data /var/www
    chmod 2775 /var/www
    find /var/www -type d -exec chmod 2775 {} +
    find /var/www/ -type f -exec chmod 0664 {} +
    ````
    <p align="center"><img src="./images/Lab06-AdvancedDetails.png" alt="Script" title="Script"/></p>
    
4. Add 8GB of storage space.
5. Add some tags for tracking. 
    - Project = ccbda bootstrap
    - Name = apache-web-server
    - Cost-center = laboratory
6. Create a new security group named `web-sg` and open port 80 for everyone and port 22 for your current IP address.

### Create a load balancer

Once the EC2 is being lauched, create an HTTP/HTTPS load balancer.

<p align="center"><img src="./images/Lab06-LoadBalancer.png" alt="ELB" title="ELB"/></p>

1. Name it `load-balancer`, with an internet-facing scheme. Add protocols HTTP and HTTPS using standard ports and select ALL availability zones from your current region. Add the following tags for tracking. 
    - Project = ccbda bootstrap
    - Cost-center = laboratory
9. You would normally obtain an SSL certificate from AWS. For that, you need to have control over the DNS of the server's domain. Select `Upload a certificate to ACM` and, for testing purposes, go to http://www.selfsignedcertificate.com/ and create a self-signed certificate for "myserver.info" and copy the private key and certificate in the corresponding text boxes. The generated information looks like the text below. Leave the certificate chain empty and select ``ELBSecurityPolicy-TLS-1-2-2017-01`` as the security policy. 

    ```
    -----BEGIN CERTIFICATE-----
    MIIDAzCCAeugAwIBAgIJAOcF+7m0Y7yQMA0GCSqGSIb3DQEBBQUAMBgxFjAUBgNV
    BAMMDW15c2VydmVyLmluZm8wHhcNMTkwMzIxMTQzOTE0WhcNMjkwMzE4MTQzOTE0
    ....
    qPNs9Xnq8GturB3J7qTX2pOX1L0fWm91kqd5saD4/n6FQwiKQX9QywROPQH5IXcm
    WaBsBYeg03iKzcq1HJn0oXjOg3ksQD658tK0ydc9oyjfFFkU/RpfjdKbsVaNsdho
    AbVaYusFQw==
    -----END CERTIFICATE-----
    
    
    -----BEGIN RSA PRIVATE KEY-----
    MIIEpAIBAAKCAQEAv26vJIiiVtkmwSv9bBEtN2v4aW9vA+CGpfDk5LY3DnbKwsAQ
    UR/gIkfgi6siVme/jtbRf6BS3Sv/0eRWAWhIqvmiD3x2SJzc449AqKIcWhdjBAZt
    ....
    bNAB2Yr6GGGx8zpdZnJtCaWpKRTfCYfB0KoHuzCCDyXW5XBDnaD1DsO2OCAccDeL
    7Qrhmkr8Pl353hCmoqH06zzkeHsPD+XxQN9ANL4lsBJdo8r3Z+F6SQ==
    -----END RSA PRIVATE KEY-----
    ```
10. Attach the ELB to the ``load-balancer-sg`` security group that you are creating. open HTTP and HTTPS protocols.

11. Create a new target group of type "Instance" and name it ``primary-apache-web-server-target`` using HTTP protocol and attach the EC2 instance named ``apache-web-server``.

12. Check the load balancer state and wait while it says "provisioning". Once the ELB state is "active", go to the "Description" tab and copy the DNS name assigned http://load-balancer-1334015960.eu-west-1.elb.amazonaws.com/ and paste it in your browser. 

    <p align="center"><img src="./images/Lab06-ApacheWorking.png" alt="Apache working" title="Apache working"/></p>

13. Once the load balancer is working correctly and showing the web server home page, we will restrict the input source to requests from the load balancer. To achieve that, go to `web-sb` and modify the input address for port 80. Remove the contents of the address "0.0.0.0/0" and type "load-balancer-sg". Select the option that appears. Remove the rule por IPv6 (source "::/0") that has access to port 80.

Now you should not be able to access the web server directly through port 80 but you should be able to access the web server using port 80 (HTTP) and 443 (HTTPS).

### Modify the web server response and create a base AWS AMI 

1. Use ssh to connect to the running EC2 instance. Remove the file `/var/www/html/index.html`  and copy the contents below to `/var/www/html/index.php`. Close the ssh session.

    ````php
    <html>
    <head></head>
    <body>
    <h1>This is instance
    <?php
        $this_instance_id = file_get_contents('http://169.254.169.254/latest/meta-data/instance-id');
    if(empty($this_instance_id))
        echo "Unknown ID";
    else
        echo (string)($this_instance_id); 
    ?>
    alive!!</h1>
    </body>
    </html>
    ````
2. Verify that the php file is working correctly and showing the EC2 instance identifier.

14. As shown below, create a machine image (AMI) using the name `test-web-server-version-1.0` with the description `LAMP web server`.

    <p align="center"><img src="./images/Lab06-AMI.png" alt="AMI" title="AMI"/></p>
    
    <p align="center"><img src="./images/Lab06-AMI-config.png" alt="AMI configure" title="AMI configure"/></p>

### Create an auto scalling group
    
1. Create an auto scaling group using the AMI that you created before. Name it `web-server-auto-scaling-group` and attach the `web-sg` security group that you created before.
    <p align="center"><img src="./images/Lab06-LoadBalancer.png" alt="Auto scalling group" title="Auto scalling group"/></p>
    <p align="center"><img src="./images/Lab06-AutoScalingGroup.png" alt="Auto scalling group" title="Auto scalling group"/></p>

16. While creating the security group, add all the availability zones that you were using before. Start with 2 instances in a VPC (do not use EC-2 classic as Network option). A warning saying "No public IP addresses will be assigned" is normal because the EC2 instances will receive HTTP/HTTPS traffic through the ELB.

17. Open the "Advanced Details" tab and select "receive traffic from one or more load balancers" and add `primary-apache-web-server-target` to Target Groups. Select Health Check Type: ELB

17. Use scaling policies to adjust the capacity of this group, scaling from 2 and 2 instances depending on the Average CPU utilization.

18. Add notifications to your e-mail via an SNS topic.

19. Add some tracking tags
    - Project = ccbda bootstrap
    - Cost-center = laboratory
    
20. Once the auto scaling group is running, you see that you have two more EC2 instances running.

### Test your new system

Use the ELB URL in your browser and see that the output of the webpage changes when reloading the URL. The EC2 instance ID of the first EC2 instance created does not show since it is not part of the auto scaling group. Two new EC2 instances have been created using the AMI provided.

### Questions

**Q611.** What happens when you use https://your-load-balancer-url instead of http://your-load-balancer-url ? Why does that happen? How could you fix it?

**Q612.** Stop all three EC2 instances and wait aprox. 5 minutes. What happens? Why?

**Q613.** Terminate all three EC2 instances and wait aprox. 5 minutes. What happens? Why?

**Q614.** How are you going to end this section regarding the use of AWS resources?

**Q615.** Create a piece of code (Python or bash) to reproduce the above steps required to launch a new set of web servers with a load balancer. Start using the AMI that you have already created.

## Task 6.2: Serverless example

This hands-on section guides you through the creation of a serverless architecture using AWS S3, AWS API Gateway, and AWS Lambda functions. This approach allows you to have a static website at AWS S3 that invokes an API gateway to perform a series of operations.

The advantage of architecting a solution this way is that you don't need to provision or pay any computing resources to be used by the web server. This architecture allows your service without spending much if there are no requests and to respond to high demand of requests without requiring any extra effort on your side. 

<p align="center"><img src="./images/Lab06-Serverless-Schema.png" alt="Serverless" title="Serverless"/></p>

### Create a new DynamoDB table

Go to the DynamoDB console and create a new table named `shopping-list`. Follow the steps detailed at [Task 4.3: Create a DynamoDB Table](./Lab04.md#task-43-create-a-dynamodb-table).

Use the tags:

- Cost-center = laboratory
- Project = ccbda serverless

### Create a Lambda function

Go to the AWS Lambda console [https://eu-west-1.console.aws.amazon.com/lambda/](https://eu-west-1.console.aws.amazon.com/lambda/) and create a new function from the blueprint `microservice-http-endpoint-python3` and name it `serverless-controller`. Create a new role and name it `serverless-controller-role`. The role needs to have `Simple microservice permissions - DynamoDB` permission.

For the **API Gateway trigger** section create a new API that is `Open, which means that your API endpoint is publicly available and can be invoked by all users. Name it `serverless-controller-API`.

Use the tags:

- Cost-center = laboratory
- Project = ccbda serverless

You need to keep the Python code that the blueprint provides. 

Once the lambda function and API are ready, the image below shall appear.

<p align="center"><img src="./images/Lab06-Serverless-Console.png" alt="Serverless" title="Serverless"/></p>


Click on ``serverless-controller`` to replace the Lambda function code by:

````python
import boto3
import json

print('Loading function')
dynamo = boto3.client('dynamodb')

def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': json.dumps(str(err) if err else res),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    }


def lambda_handler(event, context):
    operation = event['httpMethod']
    if operation == 'GET':
        return respond(None, dynamo.scan(**event['queryStringParameters']))
    elif operation == 'POST':
        return respond(None, dynamo.put_item(**json.loads(event['body'])))
    elif operation == 'DELETE':
        return respond(None, dynamo.delete_item(**json.loads(event['body'])))
    elif operation == 'PUT':
        return respond(None, dynamo.update_item(**json.loads(event['body'])))
    else:
        return respond(ValueError('Unsupported method %s'%operation))

````

Check that the [created role](https://console.aws.amazon.com/iam/home#/roles/serverless-controller-role?section=permissions) has effective permissions to interact with any DynamoDB table of your account and the working zone, as well as log execution. 

````json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Scan",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:YOUR-AWS-ZONE:YOUR-ACCOUNT-ID:table/*"
        }
    ]
}
````

````json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "logs:CreateLogGroup",
            "Resource": "arn:aws:logs:YOUR-AWS-ZONE:YOUR-ACCOUNT-ID:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:YOUR-AWS-ZONE:YOUR-ACCOUNT-ID:log-group:/aws/lambda/fname:*"
            ]
        }
    ]
}
````

Click on the tab `API Gateway`, as shown in the above screen capture, to obtain the API Endpoint URL. Test that it all works together adding `?TableName=shopping-list` to the end of the API Endpoint URL
[https://YOUR-API-HOST/test/serverless-controller?TableName=shopping-list](https://YOUR-API-HOST/test/serverless-controller?TableName=shopping-list)

**Q621.** What is the list of events that the above URL triggers? 

**Q622.** Does the reply of the above URL match what it should be expected? Why?

### Create a static website

Create a new AWS S3 bucket. Uncheck all the properties below. 
 
 <p align="center"><img src="./images/Lab06-S3-public-access.png" alt="S3 public access" title="S3 public access"/></p>
 
Use the tags:

- Cost-center = laboratory
- Project = ccbda serverless

Download and edit the file [`script.js`](Lambda-example/script.js) and replace `apiUrl = 'https://YOUR-API-HOST/test/serverless-controller';` with the API Endpoint URL without adding any query string parameter.
  
Open the bucket Properties pane, choose `Static Website Hosting`, and do the following:

- Select: Use this bucket to host a website.

- In the Index Document box, type index.html.

- Choose Save to save the website configuration.

- Write down the Endpoint `http://YOUR-BUCKET-URL`

In the Properties pane for the bucket, choose Permissions and then choose Bucket Policy.

Your bucket must have public read access to host a static website. Copy the following bucket policy, and then paste it in the Bucket Policy Editor.

```json
{
   "Version":"2012-10-17",
   "Statement":[{
     "Sid":"PublicReadForGetBucketObjects",
         "Effect":"Allow",
       "Principal": "*",
       "Action":["s3:GetObject"],
       "Resource":["arn:aws:s3:::YOUR-BUCKET/*"
       ]
     }
   ]
 }
```

In the policy, replace **YOUR-BUCKET** with the name of your bucket.

Upload [`index.html`](Lambda-example/index.html), the modified `script.js`, and [`styles.css`](Lambda-example/styles.css) to the bucket. Select all three and grant them public access.

Verify that the endpoint shows you the following contents:

 <p align="center"><img src="./images/Lab06-S3-web-form.png" alt="S3 public access" title="S3 public access"/></p>

If you open the browser console you see the following error:

````html
Access to XMLHttpRequest at 'https://YOUR-API-HOST/test/serverless-controller?TableName=shopping-list' 
from origin 'http://YOUR-BUCKET-URL' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
````

[Cross-origin resource sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is a browser security feature that restricts cross-origin HTTP requests that are initiated from scripts running in the browser. If your REST API's resources receive cross-origin requests, you may need to enable CORS support on those resources.

A cross-origin HTTP request is one that is made to:

- A different domain (for example, from example.com to amazondomains.com)

- A different subdomain (for example, from example.com to petstore.example.com)

- A different port (for example, from example.com to example.com:10777)

- A different protocol (for example, from https://example.com to http://example.com)

To solve this, open the API Gateway console. Select the `serverless-controller` item and, using the drop-down menu "Actions", Enable CORS.

 <p align="center"><img src="./images/Lab06-CORS-API.png" alt="S3 public access" title="S3 public access"/></p>

After you enable CORS support on your resource, you must deploy or redeploy the API for the new settings to take effect.

Test the URL from the static website and insert and retrieve new items in the shopping list. 

**Q623.** Explain what happens (actions and parts activated) when you type the URL in your browser to obtain the page updated with the shopping list.

**Q624.** Explain what happens (actions and parts activated) when you type a new item in the New Thing box.

 <p align="center"><img src="./images/Lab06-API-shopping-list-listing.png" alt="S3 public access" title="S3 public access"/></p>


### Testing and debugging

Lambda functions testing in the browser is not very convenient. If you change the code of the Lambda Function and want to test it before uploading it to AWS, you can use a code similar to the one below. Download the [`lambda.py`](Lambda-example/lambda.py) and use PyCharm to debug it.

```Python
import json

print('--------------------GET event test')
get_event = {
    'httpMethod': 'GET',
    'queryStringParameters': {
        'TableName': 'shopping-list'
    }
}
print('--------------------REQUEST')
print(json.dumps(get_event, indent=2))

result = lambda_handler(get_event, None)
print('--------------------RESULT')
print(json.dumps(result, indent=2))
print('--------------------RESULT body')
print(json.dumps(json.loads(result['body']), indent=2))

print('--------------------POST event test')

myvar = {
    'TableName': 'shopping-list',
    'Item': {
        'ThingId': {
            'S': 'Red apples'
        }
    }
}

post_event = {
    'httpMethod': 'POST',
    'body': json.dumps(myvar, separators=(',', ':'))
}

print('--------------------REQUEST')
print(json.dumps(post_event, indent=2))

result = lambda_handler(post_event, None)

print('--------------------RESULT')
print(json.dumps(result, indent=2))
print('--------------------RESULT body')
print(json.dumps(json.loads(result['body']), indent=2))
```

**Q625.** Have you been able to debug the code of the Lambda function? If the answer is yes, check that you are using the root API keys. Erase such keys and create a new testing user with the required permissions.

**Q626.** What are the minimum permissions that the user's API keys needs to execute the Lambda function locally?

**Q627.** Create a piece of code (Python or bash) to reproduce the above steps required to launch a new AWS Lambda function and AWS API gateway.
 
Write your answers in the `README.md` file for this session.


# How to Submit this Assignment:

Go to your responses repository, commit and push:
- the `README.md` file with your answers,

All team members shall push their responses to their private **CLOUD-COMPUTING-CLASS-2020** repository. Obviously, the responses of both members are identical.


2. Edit the file **authors.json** and include your UPC email
3. Address of the GitHub repository with your solution
4. Add any comment that you consider necessary
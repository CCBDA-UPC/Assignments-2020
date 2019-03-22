# Lab session #9: Programming your cloud infrastructure

This hands-on session will guide you through the creation of a load balancer attached to several web servers. We will be using [bootstrapping](https://en.wikipedia.org/wiki/Bootstrapping) to create this example.

## Task 9.1: Bootstrap the creation of your web server

<p align="center"><img src="./images/Lab09-Schema.png" alt="Layout" title="Layout"/></p>

### Configure the EC2 serving as a seed for the rest of the example

Go to [AWS console](https://eu-west-1.console.aws.amazon.com/ec2/) and lauch a new EC2 instance:
 
1. Use Ubuntu 16.x as base AMI
 
2. Select `t2.nano` instance type

3. For the instance details create 1 instance on your default VPC using the subnet of any availability zone. Enable auto-assign a public IP. At the bottom of the page unfold "Advanced details" and copy the following code "as text". You can check for errors, when the EC2 is running, at `/var/log/cloud-init-output.log`.
 
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
    <p align="center"><img src="./images/Lab09-AdvancedDetails.png" alt="Script" title="Script"/></p>
    
4. Add 8GB of storage space.
5. Add some tags for tracking. 
    - Project = ccbda lab
    - Name = apache-web-server
    - Cost-center = laboratory
6. Create a new security group named `web-sg` and open port 80 for everyone and port 22 for your current IP address.

### Create a load balancer

Once the EC2 is being lauched, create an HTTP/HTTPS load balancer.

<p align="center"><img src="./images/Lab09-LoadBalancer.png" alt="ELB" title="ELB"/></p>

1. Name it `load-balancer`, with internet-facing scheme. Add protocols HTTP and HTTPS using standard ports and select availabity zones "a" and "b" from your current region. Add the following tags for tracking. 
    - Project = ccbda lab
    - Cost-center = laboratory
9. You will normally obtain an SSL certificate from AWS. For that you need to have control over the DNS of the server's domain. Select `Upload a certificate to ACM` and, for testing purposes, go to http://www.selfsignedcertificate.com/ and create a self-signed certificate for "myserver.info" and copy the private key and certificate in the corresponding text boxes. The generated information looks like the text below. Leave the certificate chain empty and select ``ELBSecurityPolicy-TLS-1-2-2017-01`` as the security policy. 

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

11. Create a new target group of type IP and name it ``primary-apache-web-server-target`` using HTTP protocol and attach the EC2 instance named ``apache-web-server``.

12. Once the ELB is provisioned, go to the "Description" tab and copy the DNS name assigned http://load-balancer-1334015960.eu-west-1.elb.amazonaws.com/ and paste it in your browser. 

    <p align="center"><img src="./images/Lab09-ApacheWorking.png" alt="Apache working" title="Apache working"/></p>

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
14. Create a machine image (AMI) using the name `test-web-server-version-1.0` with the description `LAMP web server`.

    <p align="center"><img src="./images/Lab09-AMI.png" alt="AMI" title="AMI"/></p>
    
    <p align="center"><img src="./images/Lab09-AMI-config.png" alt="AMI configure" title="AMI configure"/></p>

### Create an auto scalling group
    
1. Create an auto scalling group using the AMI that you created before. Name it `web-server-auto-scaling-group` and attach the `web-sg` security group that you created before.
    <p align="center"><img src="./images/Lab09-LoadBalancer.png" alt="Auto scalling group" title="Auto scalling group"/></p>
    <p align="center"><img src="./images/Lab09-AutoScalingGroup.png" alt="Auto scalling group" title="Auto scalling group"/></p>

16. While creating the security group add the two availability zones that you were using before. Start with 2 instances in a VPC (do not use EC-2 classic as Network option). You will see an error saying "No public IP addresses will be assigned". That is correct because the EC2 instances will receive HTTP/HTTPS traffic through the ELB.

17. Open the "Advanced Details" tab and select "receive traffic from one or more load balancers" and add `primary-apache-web-server-target` to Target Groups. Select Health Check Type: ELB

17. Use scaling policies to adjust the capacity of this group, scaling from 2 and 2 instances depending on the Average CPU utilization.

18. Add notifications to your e-mail via a SNS topic.

19. Add some tracking tags
    - Project = ccbda lab
    - Cost-center = laboratory
    
20. Once the auto scalling group is running you will see that you have two more EC2 instances running.

### Test your new system

Use the ELB URL in your browser and see that the output of the webpage changes when reloading the URL. The EC2 instance ID of the first EC2 instance created does not show since it is not part of the auto scalling group. Two new EC2 instances have been created using the AMI provided.

### Questions

**Q911.** What happens when you use https://your-load-balancer-url? Why does that happen? How could you fix it?

**Q912.** Stop all three EC2 instances. What happens?

**Q913.** Terminate all three EC2 instances. What happens?

**Q914.** How are you going to end this section regarding the use of AWS resources?

**Q915.** Create a piece of code (Python or bash) to reproduce the above behavior.
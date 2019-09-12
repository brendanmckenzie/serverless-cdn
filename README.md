# Deployment

1. Run `sh build.sh` in docker/
2. Update serverless.yml, particularly the origin configurations
3. Run `serverless deploy`

## Usage

Once the Serverless deployment is complete, drop an image into your bucket, then access it at https://xxxx.cloudfront.net/image?w=500 - the Cloudfront URL will come from your Serverless deployment.  The image should now be resized.

## Prerequisites

1. Docker

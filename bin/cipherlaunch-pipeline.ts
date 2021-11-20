#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CipherLaunchPipeline } from '../lib/cipherlaunch-pipeline';

const app = new cdk.App();
new CipherLaunchPipeline(app, 'CipherlaunchPipelineStack', {
  env: {
    account: '342243318645',
    region: 'us-west-2'
  }
});
app.synth()
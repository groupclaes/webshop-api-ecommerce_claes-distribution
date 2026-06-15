#!/bin/sh

kinit -kt /secrets/svc_reports.keytab \
      reports@GROUPCLAES.BE

exec node index.min.js

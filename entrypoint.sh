#!/bin/sh
set -e

kinit -kt /tmp/svc_reports.keytab reports@GROUPCLAES.BE

exec node index.min.js

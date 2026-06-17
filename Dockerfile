# ---- Deps ----
FROM groupclaes/esbuild:v0.25.4 AS depedencies

USER root
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    krb5 \
    krb5-dev \
    krb5-libs \
    krb5-conf

USER node
#RUN ln -sf /usr/bin/python3 /usr/bin/python

ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3

RUN python3 --version
RUN which python3

# change the working directory to new exclusive app folder
WORKDIR /usr/src/app
# copy package file
COPY package.json ./
# install node packages
RUN npm install --omit=dev

# ---- Build ----
FROM depedencies AS build
# copy project
COPY ./ ./
# install node packages
RUN npm install
# create esbuild package
RUN esbuild ./index.ts --bundle --platform=node --minify --packages=external --external:'./config' --outfile=index.min.js

# --- release ---
FROM groupclaes/node:22
# Kerberos install
USER root
RUN apk add --no-cache krb5
COPY --chown=node:node krb5.conf /etc/krb5.conf
COPY --chown=node:node svc_reports.keytab /tmp/svc_reports.keytab
USER node

# change the working directory to new exclusive app folder
WORKDIR /usr/src/app
# copy dependencies
COPY --chown=node:node --from=depedencies /usr/src/app ./
# copy project file
COPY --chown=node:node --from=build /usr/src/app/index.min.js ./
# add entrypoint command and script
USER root
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh
USER node
ENTRYPOINT ["./entrypoint.sh"]

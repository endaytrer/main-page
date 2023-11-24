FROM debian

RUN apt-get update && apt-get install -y python3 python3-mysqldb

COPY app.py app.py
COPY dockerstart.sh dockerstart.sh

EXPOSE 80

ENTRYPOINT ["/dockerstart.sh"]
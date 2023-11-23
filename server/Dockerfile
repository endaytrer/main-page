FROM debian

RUN apt-get update && apt-get install -y python3 python3-flask python3-mysqldb

COPY dockerstart.sh dockerstart.sh
COPY app.py app.py

EXPOSE 80

ENTRYPOINT ["/dockerstart.sh"]
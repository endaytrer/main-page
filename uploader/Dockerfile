FROM debian

RUN apt-get update && apt-get install -y python3 python3-mysqldb

COPY app.py app.py

EXPOSE 80

ENTRYPOINT ["/dockerstart.sh"]
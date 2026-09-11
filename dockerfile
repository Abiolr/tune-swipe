FROM python:3.13.15

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install --no-cache-dir gunicorn \
    && pip install --no-cache-dir -r server/render-requirements.txt

EXPOSE 5000

CMD ["sh", "-c", "cd server && gunicorn app:app --bind 0.0.0.0:${PORT} --workers 1 -k gthread --threads 4 --timeout 120"]
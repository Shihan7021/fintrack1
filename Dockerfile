# Use lightweight Nginx image
FROM nginx:alpine

# Copy your website files into the Nginx html folder
COPY . /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]

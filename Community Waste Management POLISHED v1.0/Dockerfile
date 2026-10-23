# ============================================================
# Community Waste Management - PHP + Apache web server
# Serves the existing HTML/CSS/JS/PHP frontend on port 80.
# Host port 8080 is mapped to this container in docker-compose.yml.
# ============================================================
FROM php:8.5-apache

# Install the PHP extensions required to talk to MySQL
# (mysqli is used by config.php for login/register/admin pages)
RUN docker-php-ext-install mysqli pdo_mysql \
    && a2enmod rewrite headers

# Suppress the harmless "Could not reliably determine the server's
# fully qualified domain name" warning shown by Apache.
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Copy the whole project into the Apache document root.
# (At runtime docker-compose also bind-mounts the folder so your
#  PHP edits appear immediately without rebuilding the image.)
COPY . /var/www/html/

WORKDIR /var/www/html

EXPOSE 80
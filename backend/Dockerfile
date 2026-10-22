# Use official PHP 8.2 with Apache
FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite and headers modules for CORS and clean URLs
RUN a2enmod rewrite headers

# Copy backend source code to Apache web root
COPY . /var/www/html/

# Set working directory permissions
RUN chown -R www-data:www-data /var/www/html

# Expose standard Apache port
EXPOSE 80

CMD ["apache2-foreground"]

CREATE DATABASE IF NOT EXISTS `mainpage`;
USE `mainpage`;

CREATE TABLE IF NOT EXISTS `blogs` (
    `id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255),
    `license` VARCHAR(255),
    `likes` INT DEFAULT 0,
    `reads` INT DEFAULT 0,
    `created` DATETIME,
    `last_modified` DATETIME,
    PRIMARY KEY (`id`)
); 

CREATE TABLE IF NOT EXISTS `tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `blog_tag` (
    `blog_id` VARCHAR(255) NOT NULL,
    `tag_id` INT NOT NULL,
    FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
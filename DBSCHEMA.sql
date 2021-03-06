CREATE TABLE `bank` (
    `id` BIGINT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `nick` VARCHAR(100) NOT NULL DEFAULT '',
    `ts` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `treasure` INT NOT NULL DEFAULT 0,
    PRIMARY KEY(`id`),
    INDEX `user_idx` (`nick`)
) ENGINE=InnoDB Default CHARSET=utf8mb4;

CREATE TABLE `users` (
    `id` BIGINT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `nick` VARCHAR(100) NOT NULL DEFAULT '',
    `created_on` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=InnoDB Default CHARSET=utf8mb4;

CREATE TABLE `questions` (
    `id` BIGINT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` TEXT,
    `answer` VARCHAR(255) NOT NULL DEFAULT '',
    `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    `points` INT UNSIGNED NOT NULL DEFAULT 1,
    PRIMARY KEY(`id`),
    INDEX `cat_idx` (`category`)
) ENGINE=InnoDB Default CHARSET=utf8mb4;
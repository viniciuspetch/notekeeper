CREATE TABLE user_acc (
    id SERIAL,
    usrn VARCHAR NOT NULL,
    pswd VARCHAR NOT NULL,
    creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastupdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE notes (
    id SERIAL,
    user_id INT NOT NULL,
    content VARCHAR NOT NULL,
    creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastupdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user_acc (id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id SERIAL,
    user_id INTEGER NOT NULL,
    tag VARCHAR NOT NULL,
    creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastupdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user_acc (id) ON DELETE CASCADE
);

CREATE TABLE notes_tags (
    id SERIAL,
    notes_id INT NOT NULL,
    tags_id INT NOT NULL,
    creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastupdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (notes_id) REFERENCES notes (id) ON DELETE CASCADE,
    FOREIGN KEY (tags_id) REFERENCES tags (id) ON DELETE CASCADE
);
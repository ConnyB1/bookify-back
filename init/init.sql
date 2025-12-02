-- ========================================
-- Archivo: init.sql
-- Descripción: Script de inicialización de base de datos Bookify
-- Usuario: bookify_user (creado automáticamente por Docker)
-- ========================================

-- ========================================
-- Eliminación previa de tablas (en orden inverso)
DROP TABLE IF EXISTS mensaje CASCADE;
DROP TABLE IF EXISTS chat_usuario CASCADE;
DROP TABLE IF EXISTS chat CASCADE;
DROP TABLE IF EXISTS calificacion CASCADE;
DROP TABLE IF EXISTS intercambio CASCADE;
DROP TABLE IF EXISTS punto_encuentro CASCADE;
DROP TABLE IF EXISTS libro_imagen CASCADE;
DROP TABLE IF EXISTS libro_genero CASCADE;
DROP TABLE IF EXISTS genero CASCADE;
DROP TABLE IF EXISTS libro CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- ========================================
-- Creación de tipos ENUM
-- ========================================
CREATE TYPE libro_estado AS ENUM ('available', 'exchange_pending', 'unavailable');
CREATE TYPE propuesta_estado AS ENUM ('pending', 'accepted', 'rejected', 'canceled', 'completed');

-- ========================================
-- Tabla: usuario
-- ========================================
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    genero VARCHAR(50),
    foto_perfil_url VARCHAR(255)
);

-- ========================================
-- Tabla: libro
-- ========================================
CREATE TABLE libro (
    id_libro SERIAL PRIMARY KEY,
    id_propietario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    estado libro_estado NOT NULL DEFAULT 'available',
    descripcion TEXT
);

-- ========================================
-- Tabla: genero
-- ========================================
CREATE TABLE genero (
    id_genero SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- ========================================
-- Tabla: libro_genero (relación M:N)
-- ========================================
CREATE TABLE libro_genero (
    id_libro INTEGER REFERENCES libro(id_libro) ON DELETE CASCADE,
    id_genero INTEGER REFERENCES genero(id_genero) ON DELETE CASCADE,
    PRIMARY KEY (id_libro, id_genero)
);

-- ========================================
-- Tabla: libro_imagen
-- ========================================
CREATE TABLE libro_imagen (
    id_imagen SERIAL PRIMARY KEY,
    id_libro INTEGER NOT NULL REFERENCES libro(id_libro) ON DELETE CASCADE,
    url_imagen VARCHAR(255) NOT NULL
);

-- ========================================
-- Tabla: punto_encuentro
-- ========================================
CREATE TABLE punto_encuentro (
    id_punto_encuentro SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    latitud FLOAT,
    longitud FLOAT
);

-- ========================================
-- Tabla: intercambio
-- ========================================
CREATE TABLE intercambio (
    id_intercambio SERIAL PRIMARY KEY,
    id_libro_solicitado INTEGER NOT NULL REFERENCES libro(id_libro),
    id_usuario_solicitante INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_usuario_solicitante_receptor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_libro_ofertado INTEGER REFERENCES libro(id_libro),
    id_punto_encuentro INTEGER REFERENCES punto_encuentro(id_punto_encuentro),
    estado_propuesta propuesta_estado NOT NULL DEFAULT 'pending',
    fecha_propuesta TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_acuerdo TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- Tabla: chat
-- ========================================
CREATE TABLE chat (
    id_chat SERIAL PRIMARY KEY,
    id_intercambio INTEGER REFERENCES intercambio(id_intercambio) ON DELETE CASCADE
);

-- ========================================
-- Tabla: chat_usuario (relación M:N)
-- ========================================
CREATE TABLE chat_usuario (
    id_chat INTEGER REFERENCES chat(id_chat) ON DELETE CASCADE,
    id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    PRIMARY KEY (id_chat, id_usuario)
);

-- ========================================
-- Tabla: mensaje
-- ========================================
CREATE TABLE mensaje (
    id_mensaje SERIAL PRIMARY KEY,
    id_chat INTEGER NOT NULL REFERENCES chat(id_chat) ON DELETE CASCADE,
    id_usuario_emisor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    contenido_texto TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ========================================
-- Tabla: calificacion
-- ========================================
CREATE TABLE calificacion (
    id_intercambio INTEGER PRIMARY KEY REFERENCES intercambio(id_intercambio) ON DELETE CASCADE,
    id_usuario_calificador INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_usuario_calificado INTEGER NOT NULL REFERENCES usuario(id_usuario),
    estrellas INTEGER NOT NULL CHECK (estrellas >= 1 AND estrellas <= 5),
    reseña TEXT,
    UNIQUE (id_intercambio, id_usuario_calificador)
);

-- ========================================
-- Índices
-- ========================================
CREATE INDEX idx_libro_propietario ON libro (id_propietario);
CREATE INDEX idx_intercambio_solicitante ON intercambio (id_usuario_solicitante);
CREATE INDEX idx_mensaje_chat ON mensaje (id_chat);

-- ========================================
-- Inserciones iniciales
-- ========================================

-- 1. Usuarios
INSERT INTO usuario (id_usuario, nombre_usuario, email, password_hash, genero, foto_perfil_url)
VALUES 
(1, 'emonuel', 'emonuel@bookify.com', '$2b$10$wTf8Gq5M8dOq1Yd0B8/J4uO3N7JkR9bN8qV8v8L8X6b7G5C9L2H8', 'M', 'url_foto_emonuel'),
(2, 'laura_lector', 'laura@bookify.com', '$2b$10$wTf8Gq5M8dOq1Yd0B8/J4uO3N7JkR9bN8qV8v8L8X6b7G5C9L2H8', 'F', 'url_foto_laura');

-- 2. Géneros
INSERT INTO genero (id_genero, nombre)
VALUES 
(10, 'ciencia ficción'),
(11, 'fantasía'),
(12, 'misterio'),
(13, 'romance'),
(14, 'aventura');

-- 3. Libros
INSERT INTO libro (id_libro, id_propietario, titulo, autor, estado, descripcion)
VALUES 
(1, 1, 'Pinocho', 'Carlo Collodi', 'available', 'Una historia clásica de un niño de madera.'),
(2, 1, 'Don Quijote de la Mancha', 'Miguel de Cervantes', 'available', 'Novela española épica.'),
(3, 2, 'El Señor de los Anillos', 'J.R.R. Tolkien', 'available', 'Aventura en la Tierra Media.'),
(4, 2, 'Cien Años de Soledad', 'Gabriel García Márquez', 'available', 'Realismo mágico de Macondo.');

-- 4. Relación libro_genero
INSERT INTO libro_genero (id_libro, id_genero)
VALUES 
(1, 11),
(2, 14),
(3, 11),
(3, 14),
(4, 12);

-- 5. Ajustar secuencias
SELECT setval('usuario_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuario));
SELECT setval('libro_id_libro_seq', (SELECT MAX(id_libro) FROM libro));
SELECT setval('genero_id_genero_seq', (SELECT MAX(id_genero) FROM genero));

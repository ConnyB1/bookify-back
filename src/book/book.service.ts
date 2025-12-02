import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Libro, EstadoLibro } from '../entities/book.entity';
import { Genero } from '../entities/genero.entity';
import { LibroImagen } from '../entities/libro-imagen.entity';
import { Usuario } from '../entities/user.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Chat, ChatUsuario, Mensaje } from '../chat/chat.entity';
import { FEATURES } from '../config/features.config';
import { CreateBookDto } from './dto/book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Libro)
    private bookRepository: Repository<Libro>,
    @InjectRepository(Genero)
    private generoRepository: Repository<Genero>,
    @InjectRepository(LibroImagen)
    private libroImagenRepository: Repository<LibroImagen>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Intercambio)
    private intercambioRepository: Repository<Intercambio>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatUsuario)
    private chatUsuarioRepository: Repository<ChatUsuario>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
  ) {}

  async findAll(userId?: number): Promise<any[]> {
    // 🎯 FEATURE FLAG: Desactiva el filtro de proximidad cambiando FEATURES.PROXIMITY_FILTER_ENABLED a false
    if (!FEATURES.PROXIMITY_FILTER_ENABLED) {
      console.log('[DEBUG] ⚠️ Filtro de proximidad DESACTIVADO globalmente - retornando todos los libros');
      const libros = await this.bookRepository
        .createQueryBuilder('libro')
        .leftJoinAndSelect('libro.propietario', 'propietario')
        .leftJoinAndSelect('libro.generos', 'generos')
        .leftJoinAndSelect('libro.imagenes', 'imagenes')
        .where('libro.estado != :estado', { estado: EstadoLibro.EXCHANGED })
        .orderBy('imagenes.id_imagen', 'ASC')
        .getMany();
      return libros;
    }

    // Si no hay userId, retornar todos los libros (comportamiento original)
    if (!userId) {
      console.log('[DEBUG] Sin userId - retornando todos los libros');
      const libros = await this.bookRepository
        .createQueryBuilder('libro')
        .leftJoinAndSelect('libro.propietario', 'propietario')
        .leftJoinAndSelect('libro.generos', 'generos')
        .leftJoinAndSelect('libro.imagenes', 'imagenes')
        .where('libro.estado != :estado', { estado: EstadoLibro.EXCHANGED })
        .orderBy('imagenes.id_imagen', 'ASC')
        .getMany();
      return libros;
    }

    // Obtener la ubicación del usuario que hace la búsqueda
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: userId },
    });

    // Si el usuario no tiene ubicación configurada, retornar todos
    if (!usuario || !usuario.latitud || !usuario.longitud) {
      console.log('[DEBUG] Usuario sin ubicación configurada - retornando todos los libros');
      const libros = await this.bookRepository
        .createQueryBuilder('libro')
        .leftJoinAndSelect('libro.propietario', 'propietario')
        .leftJoinAndSelect('libro.generos', 'generos')
        .leftJoinAndSelect('libro.imagenes', 'imagenes')
        .where('libro.estado != :estado', { estado: EstadoLibro.EXCHANGED })
        .orderBy('imagenes.id_imagen', 'ASC')
        .getMany();
      return libros;
    }

    console.log(`[DEBUG] Usuario ${userId} busca desde: ${usuario.ciudad} (${usuario.latitud}, ${usuario.longitud})`);
    console.log(`[DEBUG] Radio de búsqueda: ${usuario.radio_busqueda_km} km`);

    // 🚀 Consulta OPTIMIZADA con ST_DWithin (usa índices espaciales)
    // ST_DWithin es mucho más rápido que ST_Distance porque:
    // 1. Aprovecha índices GiST/SP-GiST de PostGIS
    // 2. Solo evalúa puntos dentro del radio (no calcula todas las distancias)
    // 3. Retorna boolean, no float (más eficiente)
    
    // Primero, obtener los IDs de libros dentro del radio con sus distancias
    const librosConDistanciaRaw = await this.bookRepository
      .createQueryBuilder('libro')
      .innerJoin('libro.propietario', 'propietario')
      .select('libro.id_libro', 'id_libro')
      .addSelect(
        `ROUND(
          CAST(
            ST_Distance(
              ST_MakePoint(propietario.longitud, propietario.latitud)::geography,
              ST_MakePoint(:userLng, :userLat)::geography
            ) / 1000 AS NUMERIC
          ), 1
        )`,
        'distancia_km',
      )
      .where('propietario.latitud IS NOT NULL')
      .andWhere('propietario.longitud IS NOT NULL')
      .andWhere('libro.estado != :exchangedStatus', { exchangedStatus: EstadoLibro.EXCHANGED })
      .andWhere(
        `ST_DWithin(
          ST_MakePoint(propietario.longitud, propietario.latitud)::geography,
          ST_MakePoint(:userLng, :userLat)::geography,
          :radiusMeters
        )`,
      )
      .setParameters({
        userLat: usuario.latitud,
        userLng: usuario.longitud,
        radiusMeters: usuario.radio_busqueda_km * 1000,
      })
      .orderBy('distancia_km', 'ASC')
      .getRawMany();

    console.log(`[DEBUG] Libros encontrados dentro del radio (${usuario.radio_busqueda_km} km): ${librosConDistanciaRaw.length}`);

    if (librosConDistanciaRaw.length === 0) {
      return [];
    }

    // Crear mapa de distancias
    const distanciaMap = new Map<number, number>();
    const libroIds = librosConDistanciaRaw.map(row => {
      distanciaMap.set(parseInt(row.id_libro), parseFloat(row.distancia_km));
      return parseInt(row.id_libro);
    });

    // Obtener los libros completos con sus relaciones
    const libros = await this.bookRepository
      .createQueryBuilder('libro')
      .leftJoinAndSelect('libro.propietario', 'propietario')
      .leftJoinAndSelect('libro.generos', 'generos')
      .leftJoinAndSelect('libro.imagenes', 'imagenes')
      .where('libro.id_libro IN (:...libroIds)', { libroIds })
      .orderBy('imagenes.id_imagen', 'ASC')
      .getMany();

    // Mapear con distancias y ordenar
    const librosConDistancia = libros
      .map((libro) => ({
        ...libro,
        distancia_km: distanciaMap.get(libro.id_libro) || 0,
      }))
      .sort((a, b) => a.distancia_km - b.distancia_km);

    if (librosConDistancia.length > 0) {
      console.log('[DEBUG] Primer libro con distancia:', {
        titulo: librosConDistancia[0].titulo,
        distancia: librosConDistancia[0].distancia_km,
        propietario: librosConDistancia[0].propietario.nombre_usuario,
        coords_propietario: {
          lat: librosConDistancia[0].propietario.latitud,
          lng: librosConDistancia[0].propietario.longitud,
        },
        coords_usuario: {
          lat: usuario.latitud,
          lng: usuario.longitud,
        },
      });
      
      // 🔍 DEBUG: Mostrar todos los libros con sus distancias
      console.log('[DEBUG] Todos los libros encontrados:');
      librosConDistancia.forEach((libro, i) => {
        console.log(`  ${i + 1}. "${libro.titulo}" - ${libro.distancia_km} km (${libro.propietario.latitud}, ${libro.propietario.longitud})`);
      });
    }

    return librosConDistancia;
  }

  async create(createBookDto: CreateBookDto): Promise<Libro> {
    const { generos, imagenes, id_usuario, ...bookData } = createBookDto;

    // Crear el libro
    const libro = this.bookRepository.create({
      ...bookData,
      id_propietario: id_usuario,
    });

    // Manejar géneros si existen
    if (generos && generos.length > 0) {
      const generosEntities: Genero[] = [];
      
      for (const generoNombre of generos) {
        let genero = await this.generoRepository.findOne({
          where: { nombre: generoNombre }
        });
        
        // Si el género no existe, crearlo
        if (!genero) {
          genero = this.generoRepository.create({ nombre: generoNombre });
          await this.generoRepository.save(genero);
        }
        
        generosEntities.push(genero);
      }
      
      libro.generos = generosEntities;
    }

    // Guardar el libro
    const savedBook = await this.bookRepository.save(libro);

    // Guardar las imágenes en la tabla libro_imagen
    if (imagenes && imagenes.length > 0) {
      console.log('[DEBUG] Imágenes a guardar:', imagenes);
      
      const imagenesEntities: LibroImagen[] = [];
      for (const imagenUrl of imagenes) {
        const imagen = this.libroImagenRepository.create({
          id_libro: savedBook.id_libro,
          url_imagen: imagenUrl,
        });
        imagenesEntities.push(imagen);
      }
      
      const savedImages = await this.libroImagenRepository.save(imagenesEntities);
      console.log('[DEBUG] Imágenes guardadas:', savedImages);
      savedBook.imagenes = savedImages;
    }

    return savedBook;
  }

  async findById(id: number): Promise<Libro | null> {
    return await this.bookRepository
      .createQueryBuilder('libro')
      .leftJoinAndSelect('libro.propietario', 'propietario')
      .leftJoinAndSelect('libro.generos', 'generos')
      .leftJoinAndSelect('libro.imagenes', 'imagenes')
      .where('libro.id_libro = :id', { id })
      .orderBy('imagenes.id_imagen', 'ASC')
      .getOne();
  }

  async findByUser(userId: number): Promise<Libro[]> {
    return await this.bookRepository
      .createQueryBuilder('libro')
      .leftJoinAndSelect('libro.generos', 'generos')
      .leftJoinAndSelect('libro.imagenes', 'imagenes')
      .where('libro.id_propietario = :userId', { userId })
      .andWhere('libro.estado != :estado', { estado: EstadoLibro.EXCHANGED })
      .orderBy('imagenes.id_imagen', 'ASC')
      .getMany();
  }

  async countByUser(userId: number): Promise<number> {
    return await this.bookRepository.count({
      where: { 
        id_propietario: userId,
        estado: Not(EstadoLibro.EXCHANGED)
      },
    });
  }

  async delete(id: number): Promise<void> {
    console.log(`[BookService] Eliminando libro ID: ${id}`);
    
    // 1️⃣ Buscar todos los intercambios que involucran este libro
    const intercambios = await this.intercambioRepository.find({
      where: [
        { id_libro_solicitado_fk: id },
        { id_libro_ofertado_fk: id }
      ]
    });
    
    const intercambioIds = intercambios.map(i => i.id_intercambio);
    console.log(`[BookService] Intercambios encontrados: ${intercambioIds.length}`, intercambioIds);
    
    if (intercambioIds.length > 0) {
      // 2️⃣ Buscar todos los chats asociados a estos intercambios
      const chats = await this.chatRepository.find({
        where: { id_intercambio: In(intercambioIds) }
      });
      
      const chatIds = chats.map(c => c.id_chat);
      console.log(`[BookService] Chats encontrados: ${chatIds.length}`, chatIds);
      
      if (chatIds.length > 0) {
        // 3️⃣ Eliminar mensajes de estos chats
        const mensajesResult = await this.mensajeRepository.delete({ 
          id_chat: In(chatIds) 
        });
        console.log(`[BookService] Mensajes eliminados: ${mensajesResult.affected || 0}`);
        
        // 4️⃣ Eliminar relaciones chat_usuario
        const chatUsuariosResult = await this.chatUsuarioRepository.delete({ 
          id_chat: In(chatIds) 
        });
        console.log(`[BookService] Relaciones chat_usuario eliminadas: ${chatUsuariosResult.affected || 0}`);
        
        // 5️⃣ Eliminar los chats
        const chatsResult = await this.chatRepository.delete({ 
          id_chat: In(chatIds) 
        });
        console.log(`[BookService] Chats eliminados: ${chatsResult.affected || 0}`);
      }
      
      // 6️⃣ Eliminar los intercambios
      const intercambiosResult = await this.intercambioRepository.delete({ 
        id_intercambio: In(intercambioIds) 
      });
      console.log(`[BookService] Intercambios eliminados: ${intercambiosResult.affected || 0}`);
    }
    
    // 7️⃣ Eliminar las imágenes del libro
    const imagenesResult = await this.libroImagenRepository.delete({ id_libro: id });
    console.log(`[BookService] Imágenes eliminadas: ${imagenesResult.affected || 0}`);
    
    // 8️⃣ Finalmente, eliminar el libro
    const libroResult = await this.bookRepository.delete({ id_libro: id });
    console.log(`[BookService] Libro eliminado exitosamente. Affected rows: ${libroResult.affected || 0}`);
  }

  /**
   * Calcula la distancia entre dos puntos usando ST_Distance de PostGIS
   * @param lat1 Latitud del primer punto
   * @param lon1 Longitud del primer punto
   * @param lat2 Latitud del segundo punto
   * @param lon2 Longitud del segundo punto
   * @returns Distancia en metros
   */
  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<number> {
    const result = await this.bookRepository.query(
      `SELECT 
        ROUND(
          CAST(
            ST_Distance(
              ST_MakePoint($1, $2)::geography,
              ST_MakePoint($3, $4)::geography
            ) AS NUMERIC
          ), 0
        ) AS distance`,
      [lon1, lat1, lon2, lat2],
    );
    
    return result[0]?.distance || 0;
  }

  /**
   * Calcula distancias para múltiples pares de coordenadas en una sola query
   * @param points Array de objetos {lat1, lon1, lat2, lon2}
   * @returns Array de distancias en metros
   */
  async calculateDistanceBatch(
    points: Array<{ lat1: number; lon1: number; lat2: number; lon2: number }>,
  ): Promise<number[]> {
    if (points.length === 0) {
      return [];
    }

    // Construir query con múltiples SELECT UNION ALL
    const queries = points.map((_, index) => {
      const paramOffset = index * 4;
      return `
        SELECT 
          ${index} as idx,
          ROUND(
            CAST(
              ST_Distance(
                ST_MakePoint($${paramOffset + 1}, $${paramOffset + 2})::geography,
                ST_MakePoint($${paramOffset + 3}, $${paramOffset + 4})::geography
              ) AS NUMERIC
            ), 0
          ) AS distance
      `;
    });

    const fullQuery = queries.join(' UNION ALL ') + ' ORDER BY idx';

    // Aplanar parámetros: [lon1, lat1, lon2, lat2, lon1, lat1, lon2, lat2, ...]
    const params = points.flatMap(p => [p.lon1, p.lat1, p.lon2, p.lat2]);

    const results = await this.bookRepository.query(fullQuery, params);
    
    // Retornar distancias en el mismo orden que los puntos originales
    return results.map((r: any) => r.distance || 0);
  }
}


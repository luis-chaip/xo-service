import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { generateUniqueAlphanumericId } from 'src/utils/id.generator.utils';
import { User } from 'src/users/entities/user.entity';
import { lookup } from 'mime-types';

@Injectable()
export class EventService {

  private readonly logger = new Logger('-- ' + EventService.name + ' --');

  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const event = new Event();
    event.id = await generateUniqueAlphanumericId(this.eventRepository, 'id');
    event.creator = new User();
    event.creator.id = createEventDto.creatorId;
    event.name = createEventDto.name;
    event.description = createEventDto.description;
    event.date = createEventDto.date;
    event.startTime = createEventDto.startTime;
    event.endTime = createEventDto.endTime;
    event.location = createEventDto.location;
    event.maxGuests = createEventDto.maxGuests;
    event.visibility = { id: createEventDto.visibilityId } as any; 
    event.theme = createEventDto.theme;
    event.cover = Buffer.from(createEventDto.cover, 'base64');
    
    event.ticketPrice = createEventDto.ticketPrice;
    event.allowPhotoUpload = createEventDto.allowPhotoUpload;
    event.securityOptions = createEventDto.securityOptions;
    event.contactInfo = createEventDto.contactInfo;

    return this.eventRepository.save(event);
  }

  async findAll() {
    const events: any[] = await this.eventRepository.find();

    // Procesa los eventos de manera asíncrona
    return await Promise.all(
      events.map(async event => {
        if (event.cover) {
          // const mimeType = lookup('jpg') || 'application/octet-stream'; // Puedes cambiar "png" a lo que corresponda
          event.cover = event.cover.toString('base64');
          // event.cover = `data:${mimeType};base64,${base64}`;
        }
        return event;
      }),
    );
  }

  async findOne(id: string) {
    const event: any = await this.eventRepository.findOne({ where: { id }, relations: ['creator'] });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.cover) {
      event.cover = Buffer.from(event.cover).toString('base64');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    this.logger.log('Update Event', id)
    const event = await this.findOne(id);
    

    event.creator.id = updateEventDto.creatorId;
    event.name = updateEventDto.name ?? event.name;
    event.description = updateEventDto.description ?? event.description;
    event.date = updateEventDto.date ?? event.date;
    event.startTime = updateEventDto.startTime ?? event.startTime;
    event.endTime = updateEventDto.endTime ?? event.endTime;
    event.location = updateEventDto.location ?? event.location;
    event.maxGuests = updateEventDto.maxGuests ?? event.maxGuests;
    event.visibility = updateEventDto.visibilityId ? { id: updateEventDto.visibilityId } as any : event.visibility;
    event.theme = updateEventDto.theme ?? event.theme;
    event.cover = Buffer.from(updateEventDto.cover, 'base64');
    event.ticketPrice = updateEventDto.ticketPrice ?? event.ticketPrice;
    event.allowPhotoUpload = updateEventDto.allowPhotoUpload ?? event.allowPhotoUpload;
    event.securityOptions = updateEventDto.securityOptions ?? event.securityOptions;
    event.contactInfo = updateEventDto.contactInfo ?? event.contactInfo;

    return this.eventRepository.save(event);
  }

  remove(id: string) {
    return this.eventRepository.delete({ id });
  }
}
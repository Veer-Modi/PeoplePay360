import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ScheduleService {
  static async getAllSchedules() {
    return await prisma.workingSchedule.findMany({
      include: {
        days: true,
      },
    });
  }

  static async getScheduleById(id: string) {
    return await prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        days: true,
      },
    });
  }

  static async createSchedule(data: { name: string; type?: string; company?: string; days: any[] }) {
    // Calculate total weekly hours from days (BR-SCH-001)
    let weeklyHours = 0;
    if (data.days && data.days.length > 0) {
      data.days.forEach((day: any) => {
        // Calculate (endTime - startTime) - breakMinutes
        const start = new Date(`1970-01-01T${day.startTime}Z`);
        const end = new Date(`1970-01-01T${day.endTime}Z`);
        
        let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (day.breakMinutes) {
          diffHours -= day.breakMinutes / 60;
        }
        
        day.computedHours = Math.max(0, diffHours);
        weeklyHours += day.computedHours;
      });
    }

    return await prisma.workingSchedule.create({
      data: {
        name: data.name,
        type: data.type,
        company: data.company,
        weeklyHours,
        days: {
          create: data.days.map((day: any) => ({
            dayOfWeek: day.dayOfWeek,
            startTime: new Date(`1970-01-01T${day.startTime}Z`),
            endTime: new Date(`1970-01-01T${day.endTime}Z`),
            breakMinutes: day.breakMinutes || 0,
            computedHours: day.computedHours,
          })),
        },
      },
      include: {
        days: true,
      },
    });
  }
}

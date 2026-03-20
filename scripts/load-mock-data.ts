import sequelize from '../src/config/database';
import { User } from '../src/models/user.model';
import { Course } from '../src/models/course.model';
import { ScheduleSlot } from '../src/models/scheduleSlot.model';
import { Enrollment } from '../src/models/enrollment.model';
import bcrypt from 'bcrypt';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        await sequelize.sync({ force: true });
        console.log('Database synced (force: true).');

        const hashedPasswordProf = await bcrypt.hash('prof', 10);
        const hashedPasswordEleve = await bcrypt.hash('eleve', 10);

        const teachers: User[] = [];
        const students: User[] = [];

        console.log('Creating Teachers');
        for (let i = 1; i <= 5; i++) {
            const teacher = await User.create({
                firstName: `Prof ${i}`,
                lastName: `NomProf${i}`,
                login: `prof${i}`,
                password: hashedPasswordProf,
                role: 'teacher',
                isPrivate: i === 3 ? 1 : 0
            });
            teachers.push(teacher);
        }

        console.log('Creating Students');
        for (let i = 1; i <= 5; i++) {
            const student = await User.create({
                firstName: `Eleve ${i}`,
                lastName: `NomEleve${i}`,
                login: `eleve${i}`,
                password: hashedPasswordEleve,
                role: 'student',
                isPrivate: i === 4 ? 1 : 0
            });
            students.push(student);
        }
        console.log('Creating Courses and Slots');
        const subjects = ['Maths', 'Physique', 'Informatique', 'Anglais', 'Histoire'];
        const courses: Course[] = [];

        for (let i = 0; i < 5; i++) {
            const course = await Course.create({
                name: `${subjects[i]} - Avancé`,
                description: `Cours de ${subjects[i]} pour le niveau avancé`,
                totalHours: 30,
                teacherId: teachers[i].id
            });
            courses.push(course);

            let day1 = "1";
            let day2 = "3";
            let startHour = 8;

            if (i === 1) startHour = 10;
            if (i === 2) startHour = 14;
            if (i === 3) { day1 = "2"; day2 = "4"; startHour = 8; }
            if (i === 4) { day1 = "2"; day2 = "4"; startHour = 14; }

            await ScheduleSlot.create({
                courseId: course.id,
                dayOfWeek: day1,
                startTime: new Date(`1970-01-01T${startHour.toString().padStart(2, '0')}:00:00`),
                endTime: new Date(`1970-01-01T${(startHour + 2).toString().padStart(2, '0')}:00:00`),
                createdAt: new Date(),
                modifiedAt: new Date()
            });

            await ScheduleSlot.create({
                courseId: course.id,
                dayOfWeek: day2,
                startTime: new Date(`1970-01-01T${startHour.toString().padStart(2, '0')}:00:00`),
                endTime: new Date(`1970-01-01T${(startHour + 2).toString().padStart(2, '0')}:00:00`),
                createdAt: new Date(),
                modifiedAt: new Date()
            });
        }

        await ScheduleSlot.create({
            courseId: courses[0].id,
            dayOfWeek: "2",
            startTime: new Date('1970-01-01T10:00:00'),
            endTime: new Date('1970-01-01T12:00:00'),
            createdAt: new Date(),
            modifiedAt: new Date()
        });

        await ScheduleSlot.create({
            courseId: courses[1].id,
            dayOfWeek: "2",
            startTime: new Date('1970-01-01T11:00:00'),
            endTime: new Date('1970-01-01T13:00:00'),
            createdAt: new Date(),
            modifiedAt: new Date()
        });

        console.log('Enrolling Students...');

        await Enrollment.create({
            studentId: students[0].id,
            courseId: courses[0].id,
            enrollmentAt: new Date(),
            createAt: new Date(),
            updateAt: new Date()
        });

        await Enrollment.create({
            studentId: students[1].id,
            courseId: courses[1].id,
            enrollmentAt: new Date(),
            createAt: new Date(),
            updateAt: new Date()
        });

        for (let i = 2; i < 5; i++) {
            await Enrollment.create({
                studentId: students[i].id,
                courseId: courses[i % 5].id,
                enrollmentAt: new Date(),
                createAt: new Date(),
                updateAt: new Date()
            });
            const secondCourseId = (i + 1) % 5;
            if (courses[secondCourseId].id !== courses[0].id && courses[secondCourseId].id !== courses[1].id) {
                await Enrollment.create({
                    studentId: students[i].id,
                    courseId: courses[secondCourseId].id,
                    enrollmentAt: new Date(),
                    createAt: new Date(),
                    updateAt: new Date()
                });
            }
        }

        console.log('Mock data loaded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error loading mock data:', error);
        process.exit(1);
    }
};

run();

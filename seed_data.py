from datetime import date, timedelta, datetime
from models import db, User, MemberProfile, Trainer, Plan, Membership, Payment, ContactMessage
from config import Config

def seed_database(app):
    with app.app_context():
        db.create_all()
        
        # Check if already seeded
        if User.query.filter_by(username='admin').first():
            return
            
        print("Seeding initial data for The Power Gym...")
        
        # 1. Staff Admin User
        admin_user = User(
            username='admin',
            email='admin@thepowergym.in',
            phone='+91 98765 43210',
            role='staff',
            is_active=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.flush()
        
        admin_profile = MemberProfile(
            user_id=admin_user.id,
            full_name='Gym Manager (Chief Staff)',
            avatar='trainer_vikram.jpg',
            age=32,
            gender='Male',
            fitness_goal='Gym Operations & Powerlifting Management'
        )
        db.session.add(admin_profile)
        
        # 2. Trainers
        trainer1 = Trainer(
            name='Alex Vance',
            specialty='Powerlifting & Heavy Compound Strength',
            experience_years=7,
            bio='Certified NSCA Powerlifting Coach with over 7 years coaching national level lifters. Specializes in squat, bench, and deadlift biomechanics.',
            photo='trainer_alex.jpg',
            rating=4.9,
            phone='+91 98700 11223',
            email='alex@thepowergym.in',
            fee_per_month=2500.0,
            is_available=True
        )
        
        trainer2 = Trainer(
            name='Maya Sharma',
            specialty='HIIT, Functional Cross-Training & Mobility',
            experience_years=5,
            bio='Former national athlete and certified ACE functional fitness coach. Dedicated to high-octane fat burning, stamina building, and posture alignment.',
            photo='trainer_maya.jpg',
            rating=4.9,
            phone='+91 98700 22334',
            email='maya@thepowergym.in',
            fee_per_month=2000.0,
            is_available=True
        )
        
        trainer3 = Trainer(
            name='Vikram Raj',
            specialty='Hypertrophy, Bodybuilding & Nutrition Architecture',
            experience_years=6,
            bio='Gold-certified fitness nutritionist and physique competitor. Master of progressive overload, macro-nutrient timing, and lean muscle gain.',
            photo='trainer_vikram.jpg',
            rating=5.0,
            phone='+91 98700 33445',
            email='vikram@thepowergym.in',
            fee_per_month=3000.0,
            is_available=True
        )
        db.session.add_all([trainer1, trainer2, trainer3])
        db.session.flush()
        
        # 3. Membership Plans
        plan_monthly = Plan(
            name='Starter Beast (Monthly)',
            duration_months=1,
            price=999.0,
            features_list='''Full Strength & Free Weights Zone Access
Cardio Theatre Access (Treadmills, Rowers, Cycles)
Clean Locker Rooms & Hot Showers
1 Free Fitness Assessment & Body Composition Test
Free WiFi & Water Station''',
            is_popular=False,
            is_active=True
        )
        
        plan_quarterly = Plan(
            name='Power Pro (3 Months)',
            duration_months=3,
            price=2499.0,
            features_list='''Everything in Starter Beast Plan
Customized Workout Split (Push-Pull-Legs / Upper-Lower)
Personalized Indian Macro & Diet Chart
Unlimited Steam & Sauna Access
2 Free 1-on-1 Personal Training Sessions
Trainer Guidance on Gym Floor''',
            is_popular=True,
            is_active=True
        )
        
        plan_yearly = Plan(
            name='Elite Titan (12 Months)',
            duration_months=12,
            price=7999.0,
            features_list='''Full Unlimited 365 Days 24/7 Access
Dedicated Personal Trainer Check-in Weekly
Monthly InBody Composition & Bio-Scan
2 Free Guest Passes Every Month
Free Official The Power Gym Neon Shaker & Jersey
Priority Lockers & Towel Service''',
            is_popular=False,
            is_active=True
        )
        
        plan_vip = Plan(
            name='VIP Transformation (6 Months + 1-on-1 PT)',
            duration_months=6,
            price=12999.0,
            features_list='''Exclusive 1-on-1 Personal Trainer Assigned
Daily Custom Workout & Supplement Protocol
Direct WhatsApp Access to Head Trainer
Custom Meal Plans & Weekly Form Video Audits
VIP Locker, Towel & Protein Shake Bar Credit
Guaranteed Body Transformation Metric Tracking''',
            is_popular=False,
            is_active=True
        )
        db.session.add_all([plan_monthly, plan_quarterly, plan_yearly, plan_vip])
        db.session.flush()
        
        # Initial Contact Message
        contact = ContactMessage(
            name='Kavita Krishnan',
            email='kavita.k@example.com',
            phone='+91 97412 88441',
            message='Hi, I would like to enquire about morning batch timings and female personal trainer availability with Maya Sharma.',
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.session.add(contact)
        
        # Clean up any legacy dummy customer ('rahul') to keep database pristine for real members
        dummy_user = User.query.filter_by(username='rahul').first()
        if dummy_user and dummy_user.role == 'customer':
            Membership.query.filter_by(user_id=dummy_user.id).delete()
            Payment.query.filter_by(user_id=dummy_user.id).delete()
            if dummy_user.profile:
                db.session.delete(dummy_user.profile)
            db.session.delete(dummy_user)
            
        db.session.commit()
        print("Database successfully initialized with plans, trainers, and staff administrator (Zero dummy members)!")

if __name__ == '__main__':
    from flask import Flask
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    seed_database(app)

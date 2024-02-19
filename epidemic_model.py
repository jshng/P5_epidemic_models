import math
import numpy as np
import random
#import matplotlib.pyplot as plt

class Canvas:

    def __init__(self, height, width, framerate, secs_per_day):
        self.height = height
        self.width = width
        self.framerate = framerate
        self.sec_per_day = secs_per_day
        self.frames_per_day = framerate*secs_per_day
        self.time = 0

    def time_step(self):
        self.time += 1

class Bubble:

    def __init__(self, x, y, r, particles, quarantine=False):
        self.x = x
        self.y = y
        self.r = r
        self.particles = particles
        self.quarantine = quarantine
    
    def check_infection(self):
        quarantine = False
        for p in self.particles:
            if p.state == 'I':
                quarantine = True
        return quarantine

class Particle:

    def __init__(self,x, y, r, heading, speed, state, 
                 alpha, gamma, canvas, bubble):
        self.x = x
        self.y = y
        self.r = r
        self.heading = heading
        self.speed = speed
        self.state = state
        self.state_time = 0
        self.canvas = canvas
        self.bubble = bubble
        ## get cartesian speed
        self.speedx = self.speed*math.cos(self.heading)
        self.speedy = self.speed*math.sin(self.heading)
        ## get state transitions
        self.latent_period = alpha*canvas.frames_per_day
        self.infectious_period = gamma*canvas.frames_per_day

    def move(self, bubbles):
        # add a wiggle
        self.heading += random.uniform(-0.5, 0.5)
        # avoid any quarantined bubbles
        other_bubbles = [b for b in bubbles if b != self.bubble]
        for b in other_bubbles:
            if b.quarantine:
                # chenge direction to avoid bubble
                self.heading = self.avoid_bubble(b)
        # turn if hitting the side
        self.heading = self.bounce_at_edge()
        # adjust so 0 < heading < 2*pi
        if self.heading < 0:
            self.heading += 2*math.pi
        elif self.heading > 2*math.pi:
            self.heading -= 2*math.pi
        # update the location based on the speed
        self.update_location()
    
    def update_location(self):
        self.speedx = self.speed*math.cos(self.heading)
        self.speedy = self.speed*math.sin(self.heading)
        self.x += self.speedx
        self.y += self.speedy

    def bounce_at_edge(self):
        new_heading = self.heading
        if (self.x < 0) or (self.x > self.canvas.width):
            new_heading = math.pi - self.heading
        if (self.y < 0) or (self.y > self.canvas.height):
            new_heading = 2*math.pi - self.heading
        return new_heading         

    def avoid_bubble(self, b):
        # check distance
        d = math.dist((self.x, self.y), (b.x, b.y))
        min_distance = self.r + b.r + 50
        # initialis the new angle as the current angle
        new_angle = self.heading
        if d<min_distance:
            # calculate reflection angle
            angle_to_b = math.atan2(b.y-self.y, b.x-self.x)  
            new_angle = -2*angle_to_b - self.heading
        return new_angle

    def go_home(self):
        # add a random wiggle
        #self.heading += random.uniform(-0.1, 0.1)
        target_heading = math.atan2(self.bubble.y - self.y, self.bubble.x- self.x)
        dist = math.dist((self.x, self.y), (self.bubble.x, self.bubble.y))
        if dist > self.bubble.r:
            angle_diff = target_heading - self.heading
            if angle_diff > math.pi:
                angle_diff -= 2*math.pi
            elif angle_diff < -2*math.pi:
                angle_diff += 2*math.pi
            # multiply by 0.2 to smooth motion
            self.heading += angle_diff*0.2

    def infect_particles(self, particles):
        if self.state != 'I':
            pass
        for p in particles:
            dist = math.dist((self.x, self.y), (p.x, p.y))
            if (dist < self.r) and (p.state == 'S'):
                p.state = 'E'

    def transition_state(self):
        if(self.state=='E') and (self.state_time > self.latent_period):
            self.state = 'I'
            self.state_time = 0
        if(self.state=='I') and (self.state_time > self.infectious_period):
            self.state = 'R'
            self.state_time = 0
    
    def time_step(self):
        self.state_time +=1

def map_value(n, start1, stop1, start2, stop2):
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2

if __name__ == '__main__':
    n_bubbles = 12
    canvas = Canvas(height=800, width=800,framerate=60,secs_per_day=12)
    cols = np.floor(math.sqrt(n_bubbles))
    rows = np.floor(n_bubbles/cols)
    particles = []
    bubbles = []
    for i in range(n_bubbles):
        col = i%cols
        row = i//cols
        x = map_value(col, 0, cols-1, 100, canvas.width-100)
        y = map_value(row, 0, rows-1, 100, canvas.height-100)
        bubbles.append(Bubble(x, y, 20, particles, False))
    
    n_particles = canvas.width//10
    
    for i in range(n_particles):
        bubble = random.choice(bubbles)
        p = Particle(bubble = bubble,
                     x = bubble.x + random.uniform(-10,10),
                     y = bubble.y + random.uniform(-10,10),
                     heading = random.uniform(0, 2*math.pi),
                     speed = random.uniform(1,3),
                     r = 20,
                     canvas=canvas,
                     state = 'S',
                     alpha = 1,
                     gamma = 2)
        particles.append(p)

    # add an exposed particle
    bubble = bubbles[0]
    p = Particle(bubble = bubble,
                 x = bubble.x + random.uniform(-10,10),
                 y = bubble.y + random.uniform(-10,10),
                 heading = random.uniform(0, 2*math.pi),
                 speed = random.uniform(1,3),
                 r = 20,
                 canvas=canvas,
                 state = 'E',
                 alpha = 0.75,
                 gamma = 2)

    epi_curve = []
    n_steps = 6000
    for i in range(6000):
        for bubble in bubbles:
            bubble.quarantine = bubble.check_infection()

        for particle in particles:
            particle.move(bubbles)
            particle.transition_state()
            if particle.state=='I':
                particle.infect_particle()
            particle.time_step()
            if canvas.time%canvas.frames_per_day < canvas.frames_per_day*2/3:
                particle.go_home()
            elif particle.bubble.quarantine:
                particle.go_home()

        n_infected = sum([p for p in particles if p.state == 'I'])
        epi_curve.append(n_infected)
        canvas.time_step
        
    




            



